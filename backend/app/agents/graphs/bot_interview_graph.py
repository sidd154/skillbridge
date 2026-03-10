from langgraph.graph import StateGraph, END
from ..state.models import BotInterviewState
from .interview_nodes import generate_opening, analyze_and_next_question
from ...services.supabase_client import supabase

def load_context_node(state: BotInterviewState):
    # Already loaded via API in real app
    return state

def generate_opening_node(state: BotInterviewState):
    skills = state.get("passport_skills", [])
    desc = state.get("job_description", "")
    
    msg = generate_opening("Software Engineer", desc, skills)
    ts = state.get("transcript", [])
    ts.append({"speaker": "bot", "text": msg})
    
    return {"transcript": ts, "question_count": 1, "current_phase": "intro"}

def analyze_answer_node(state: BotInterviewState):
    # This node conceptually executes when Human replies.
    ts = state.get("transcript", [])
    analysis, next_q = analyze_and_next_question(ts, state.get("current_phase", "intro"), state.get("recruiter_mcqs", []))
    
    return {"_temp_next_q": next_q, "_temp_analysis": analysis}

def generate_next_question_node(state: BotInterviewState):
    ts = state.get("transcript", [])
    next_q = state.get("_temp_next_q", "Can you tell me more?")
    
    ts.append({"speaker": "bot", "text": next_q})
    qc = state.get("question_count", 1) + 1
    
    return {"transcript": ts, "question_count": qc}

def transition_phase_node(state: BotInterviewState):
    qc = state.get("question_count", 0)
    phase = state.get("current_phase", "intro")
    
    if phase == "intro" and qc >= 2:
        phase = "technical_deep_dive"
    elif phase == "technical_deep_dive" and qc >= 6:
        phase = "recruiter_mcqs"
    elif phase == "recruiter_mcqs" and qc >= 9:
        phase = "closing"
        
    return {"current_phase": phase}

def save_transcript_node(state: BotInterviewState):
    # Supabase update
    try:
        supabase.table("interview_sessions").update({
            "transcript": state.get("transcript", [])
        }).eq("application_id", state.get("application_id")).execute()
    except Exception as e:
        print(e)
    return state

def end_interview_node(state: BotInterviewState):
    # Triggers Summarizer (Agent 6)
    return state

def branch_route(state: BotInterviewState):
    if state.get("current_phase") == "closing" and state.get("question_count", 0) >= 10:
        return "end_interview"
    # Otherwise wait for user input (Wait Node concept omitted for simplicity, WebSocket handles loop)
    # The LangGraph here models one cycle.
    return "save_transcript"

def create_bot_interview_graph():
    workflow = StateGraph(BotInterviewState)
    
    workflow.add_node("load_context", load_context_node)
    workflow.add_node("generate_opening", generate_opening_node)
    workflow.add_node("analyze_answer", analyze_answer_node)
    workflow.add_node("generate_next_question", generate_next_question_node)
    workflow.add_node("transition_phase", transition_phase_node)
    workflow.add_node("save_transcript", save_transcript_node)
    workflow.add_node("end_interview", end_interview_node)
    
    workflow.set_entry_point("load_context")
    workflow.add_edge("load_context", "generate_opening")
    workflow.add_edge("generate_opening", "save_transcript")
    
    # Loop entry
    workflow.add_edge("analyze_answer", "generate_next_question")
    workflow.add_edge("generate_next_question", "transition_phase")
    workflow.add_edge("transition_phase", "save_transcript")
    
    workflow.add_conditional_edges("save_transcript", branch_route, {"end_interview": "end_interview", "save_transcript": END})
    workflow.add_edge("end_interview", END)
    
    return workflow.compile()
