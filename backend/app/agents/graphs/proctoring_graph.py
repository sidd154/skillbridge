from langgraph.graph import StateGraph, END
from ..state.models import ProctoringState
from ...services.supabase_client import supabase

def record_event_node(state: ProctoringState):
    # This node is conceptually hit for every real-time WS event. 
    # State holds the aggregation of events.
    return state

def analyse_timing_node(state: ProctoringState):
    timings = state.get("question_timings", [])
    anomalies = state.get("anomaly_flags", [])
    
    # We can fetch the session to get question difficulties.
    # For now, simplistic mock analysis: flag anything under 15s
    for tm in timings:
        if tm.get("spent_seconds", 0) < 15:
            anomalies.append(f"Q{tm.get('question_index')} answered suspiciously fast.")
            
    return {"anomaly_flags": anomalies}

def compute_trust_score_node(state: ProctoringState):
    score = 100.0
    
    # -5 per tab switch (max 30)
    tabs = min(state.get("tab_switches", 0), 6)
    score -= tabs * 5
    
    # -3 per clipboard event (max 15)
    clips = min(state.get("clipboard_events", 0), 5)
    score -= clips * 3
    
    # -2 per timing anomaly (max 20)
    anom = min(len(state.get("anomaly_flags", [])), 10)
    score -= anom * 2
    
    score = max(0.0, score)
    return {"score": score}

def save_proctoring_log_node(state: ProctoringState):
    session_id = state.get("session_id")
    
    log_data = {
        "tab_switches": state.get("tab_switches", 0),
        "clipboard_events": state.get("clipboard_events", 0),
        "anomalies": state.get("anomaly_flags", [])
    }
    
    try:
        supabase.table("test_sessions").update({
            "proctoring_log": log_data,
            "proctoring_score": state.get("score", 100.0)
        }).eq("id", session_id).execute()
        print(f"Proctoring log for {session_id} saved.")
    except Exception as e:
        print(f"Failed to save proctoring log: {e}")
        
    return state

def create_proctoring_graph():
    workflow = StateGraph(ProctoringState)
    workflow.add_node("record_event", record_event_node)
    workflow.add_node("analyse_timing", analyse_timing_node)
    workflow.add_node("compute_trust_score", compute_trust_score_node)
    workflow.add_node("save_proctoring_log", save_proctoring_log_node)
    
    workflow.set_entry_point("record_event")
    workflow.add_edge("record_event", "analyse_timing")
    workflow.add_edge("analyse_timing", "compute_trust_score")
    workflow.add_edge("compute_trust_score", "save_proctoring_log")
    workflow.add_edge("save_proctoring_log", END)
    
    return workflow.compile()
