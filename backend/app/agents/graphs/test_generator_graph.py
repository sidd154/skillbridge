import uuid
from langgraph.graph import StateGraph, END
from ..state.models import TestGeneratorState
from ..nodes.test_gen_nodes import generate_questions_for_skills
from ...services.supabase_client import supabase

def generate_questions_node(state: TestGeneratorState):
    skills = state.get("extracted_skills", [])
    questions = generate_questions_for_skills(skills)
    return {"generated_questions": questions}

def validate_questions_node(state: TestGeneratorState):
    # Basic validation checkpoint concept - verify schema, correct_answer logic. 
    # Hardcoded pass for this iteration.
    return state

def save_session_node(state: TestGeneratorState):
    candidate_id = state.get("candidate_id")
    questions = state.get("generated_questions", [])
    
    # Create the test session in Supabase so the candidate can start taking it
    try:
        session = supabase.table("test_sessions").insert({
            "candidate_id": candidate_id,
            "questions": questions,
            "status": "pending_consent", # Custom flow state
        }).execute()
        
        print(f"Created Test Session {session.data[0]['id']} with {len(questions)} questions.")
        return state
    except Exception as e:
        print(f"Failed to save test session: {e}")
        return state

def create_test_generator_graph():
    workflow = StateGraph(TestGeneratorState)
    workflow.add_node("generate_questions", generate_questions_node)
    workflow.add_node("validate_questions", validate_questions_node)
    workflow.add_node("save_session", save_session_node)
    
    workflow.set_entry_point("generate_questions")
    workflow.add_edge("generate_questions", "validate_questions")
    workflow.add_edge("validate_questions", "save_session")
    workflow.add_edge("save_session", END)
    
    return workflow.compile()
