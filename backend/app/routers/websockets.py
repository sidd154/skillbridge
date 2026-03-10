from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from typing import Dict
from ..services.supabase_client import supabase
from ..services.auth_middleware import get_current_user

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
    try:
        # Example: Trigger Agent 5 to send opening message on connect
        await manager.send_json({"speaker": "bot", "text": "Hello, I'm the SkillBridge bot. Let's begin the interview."}, session_id)
        
        while True:
            data = await websocket.receive_json()
            candidate_text = data.get("text")
            print(f"Interview candidate msg: {candidate_text}")
            
            # Here: Run Agent 5 iteratively with the new answer.
            # Mock placeholder response:
            bot_response = f"Interesting. Can you elaborate further on that?"
            
            await manager.send_json({"speaker": "bot", "text": bot_response}, session_id)
            
    except WebSocketDisconnect:
        manager.disconnect(session_id)
        print(f"Interview session {session_id} disconnected")
        # Trigger Agent 6 (Summarizer) here conceptually
