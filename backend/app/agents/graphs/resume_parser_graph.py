from langgraph.graph import StateGraph, END
from app.agents.state.models import ResumeParserState
from app.agents.nodes.resume_nodes import extract_skills_from_text
from app.services.pdf_parser import extract_text_from_pdf
from app.services.supabase_client import supabase

def extract_text_node(state: ResumeParserState):
    raw_text = extract_text_from_pdf(state["pdf_path"])
    return {"raw_text": raw_text}

def parse_skills_node(state: ResumeParserState):
    skills = extract_skills_from_text(state["raw_text"])
    return {"extracted_skills": skills}

def save_skills_node(state: ResumeParserState):
    # Depending on DB structure we save skills. 
    # For now we can store them in a temp table or just update the candidate with temporary `skills` field (requires altering DB conceptually, but we can just return it).
    # Since Skill Passport generation requires a test, we won't create a passport yet.
    # Hackathon shortcut: save raw JSON text to candidate record (we'd need an `extracted_skills` temp column, which we didn't add in schema, so let's just return it to the caller for Agent 2).
    print(f"Agent 1 Complete. Extracted {len(state.get('extracted_skills', []))} skills for user {state['candidate_id']}.")
    return state

def create_resume_parser_graph():
    workflow = StateGraph(ResumeParserState)
    workflow.add_node("extract_text", extract_text_node)
    workflow.add_node("parse_skills", parse_skills_node)
    workflow.add_node("save_skills", save_skills_node)
    
    workflow.set_entry_point("extract_text")
    workflow.add_edge("extract_text", "parse_skills")
    workflow.add_edge("parse_skills", "save_skills")
    workflow.add_edge("save_skills", END)
    
    return workflow.compile()
