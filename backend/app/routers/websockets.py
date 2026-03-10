from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from typing import Dict
from ..services.supabase_client import supabase
from ..services.auth_middleware import get_current_user
from ..agents.graphs.bot_interview_graph import create_bot_interview_graph

router = APIRouter(prefix="/ws", tags=["websockets"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket

    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]

    async def send_json(self, message: dict, session_id: str):
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_json(message)

manager = ConnectionManager()


@router.websocket("/proctoring/{session_id}")
async def proctoring_endpoint(websocket: WebSocket, session_id: str):
    """
    WebSocket for receiving live proctoring events during the MCQ test.
    Events: tab_switch, clipboard_event, question_timing
    This feeds into Agent 3 (Proctoring Graph).
    """
    await manager.connect(websocket, session_id)
    try:
        while True:
            data = await websocket.receive_json()
            # Feed data to Agent 3 proctoring state here
            print(f"Proctoring event for {session_id}: {data}")
            
            # Example mock echo
            await manager.send_json({"status": "received", "event": data.get("type")}, session_id)
            
    except WebSocketDisconnect:
        manager.disconnect(session_id)
        print(f"Proctoring session {session_id} disconnected")


@router.websocket("/interview/{session_id}")
async def interview_endpoint(websocket: WebSocket, session_id: str):
    """
    WebSocket for the Bot Interview. Uses Web Speech API transcript text from frontend.
    Returns generated bot question text.
    Feeds into Agent 5 (Bot Interview Graph).
    """
    await manager.connect(websocket, session_id)
    
    # Initialize interview graph and state for this session
    interview_graph = create_bot_interview_graph()
    interview_state = {
        "session_id": session_id,
        "transcript": [],
        "passport_skills": [],
        "job_description": "",
        "recruiter_mcqs": [],
        "question_count": 0,
        "current_phase": "intro",
    }
    
    try:
        # --- Opening Invocation ---
        # Run the graph entry flow (load_context -> generate_opening -> save_transcript)
        opening_result = interview_graph.invoke(interview_state)
        
        # Pull the bot's first message from the resulting transcript
        bot_transcript = opening_result.get("transcript", [])
        opening_message = next((m["text"] for m in bot_transcript if m["speaker"] == "bot"), "Hello! I am your SkillBridge AI interviewer. Let's begin.")
        
        # Update our persistent state with the opening run's output
        interview_state = opening_result
        
        # Send opening message to candidate
        await manager.send_json({"speaker": "bot", "text": opening_message}, session_id)
        
        # --- Conversation Loop ---
        while True:
            data = await websocket.receive_json()
            candidate_text = data.get("text", "")
            
            if not candidate_text:
                continue
            
            # Add the candidate's answer to the state transcript
            interview_state["transcript"].append({"speaker": "candidate", "text": candidate_text})
            
            # Invoke Agent 5's answer analysis sub-loop
            turn_result = interview_graph.invoke({
                **interview_state,
                # Force entry into the answer analysis path of the graph
                "_entry_node": "analyze_answer"
            })
            
            # Get the bot's new question from the updated transcript
            updated_transcript = turn_result.get("transcript", interview_state["transcript"])
            bot_responses = [m for m in updated_transcript if m["speaker"] == "bot"]
            latest_bot_response = bot_responses[-1]["text"] if bot_responses else "Can you elaborate on that?"
            
            interview_state = turn_result
            
            await manager.send_json({"speaker": "bot", "text": latest_bot_response}, session_id)
            
            # Check end condition
            if turn_result.get("current_phase") == "closing" and turn_result.get("question_count", 0) >= 10:
                await manager.send_json({"speaker": "bot", "text": "Thank you for your time! The interview is now complete. Our team will review your performance. Good luck!"}, session_id)
                break
            
    except WebSocketDisconnect:
        manager.disconnect(session_id)
        print(f"Interview session {session_id} disconnected")
        # Trigger Agent 6 (Summarizer) asynchronously here in production
