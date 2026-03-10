from datetime import datetime, timedelta
import json
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from typing import List, Dict, Any
from langgraph.graph import StateGraph, END
from ..state.models import PassportIssuerState
from ...services.supabase_client import supabase

llm = ChatOpenAI(model="gpt-4o", temperature=0.7)

def evaluate_answers_node(state: PassportIssuerState):
    answers = state.get("answers", [])
    correct_answers = state.get("correct_answers", [])
    
    correct_count = 0
    total = len(correct_answers)
    
    # Hardcoded simplistic evals for demo scope
    for i, ans in enumerate(answers):
        if i < total and ans.get("selected_option") == correct_answers[i].get("correct_answer"):
            correct_count += 1
            
    score = (correct_count / max(total, 1)) * 100
    passed = score >= 70.0
    
    return {"score": score, "passed": passed}

# Roadmap generation AI setup
roadmap_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are an expert technical mentor. The candidate failed their skill validation test.
Given the skills they failed and their claimed proficiency, generate an improvement roadmap.
Return JSON mapping each failed skill to:
1. gaps_exposed: specific concepts they struggled with.
2. resources: minimum 3 URLs to real, high-quality learning resources (docs, courses, sites).
3. estimated_weeks: time needed to prepare for re-test.
\nFormat Instructions:\n{format_instructions}""")
])

def issue_passport_node(state: PassportIssuerState):
    candidate_id = state.get("candidate_id")
    # For a real implementation, we filter extracted_skills by >60% per-skill scores.
    # For now we use the overall >70% passing criteria to issue all.
    skills = state.get("extracted_skills", [])
    
    # issue passport
    issued = datetime.utcnow()
    expires = issued + timedelta(days=540) # 18 months
    
    try:
        res = supabase.table("skill_passports").insert({
            "candidate_id": candidate_id,
            "skills": skills,
            "proctoring_score": state.get("proctoring_score", 100.0),
            "issued_at": issued.isoformat(),
            "expires_at": expires.isoformat(),
            "is_active": True
        }).execute()
        
        passport_id = res.data[0]["id"]
        # Update candidate with active passport
        supabase.table("candidates").update({"passport_id": passport_id}).eq("id", candidate_id).execute()
        print(f"Issued passport {passport_id} to candidate {candidate_id}")
    except Exception as e:
        print(f"Failed to issue passport: {e}")
        
    return state

def generate_roadmap_node(state: PassportIssuerState):
    candidate_id = state.get("candidate_id")
    session_id = state.get("session_id")
    skills = state.get("extracted_skills", [])
    
    # Mock parser for demo layout since building a complex Pydantic map dynamically is bulky:
    # We will just write a simplistic string/dict format for the DB map.
    
    retake_date = datetime.utcnow() + timedelta(days=14)
    
    try:
        # We can simulate the LLM call or do it fully. Here is a mocked roadmap dump.
        mock_roadmap = {
            "React": {
                "gaps": "Struggled with Context API and custom hooks",
                "resources": [{"title": "React Docs", "url": "react.dev", "type": "docs"}],
                "estimated_weeks": 2
            }
        }
        
        supabase.table("improvement_roadmaps").insert({
            "candidate_id": candidate_id,
            "test_session_id": session_id,
            "failed_skills": skills,
            "roadmap": mock_roadmap,
            "retake_available_at": retake_date.isoformat()
        }).execute()
        
    except Exception as e:
        print(f"Roadmap gen error: {e}")
        
    return state

def branch_logic(state: PassportIssuerState):
    if state.get("passed", False):
        return "issue_passport"
    return "generate_roadmap"

def create_passport_issuer_graph():
    workflow = StateGraph(PassportIssuerState)
    
    workflow.add_node("evaluate_answers", evaluate_answers_node)
    workflow.add_node("issue_passport", issue_passport_node)
    workflow.add_node("generate_roadmap", generate_roadmap_node)
    
    workflow.set_entry_point("evaluate_answers")
    workflow.add_conditional_edges(
        "evaluate_answers",
        branch_logic,
        {
            "issue_passport": "issue_passport",
            "generate_roadmap": "generate_roadmap"
        }
    )
    workflow.add_edge("issue_passport", END)
    workflow.add_edge("generate_roadmap", END)
    
    return workflow.compile()
