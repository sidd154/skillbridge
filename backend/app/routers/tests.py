from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from ..services.auth_middleware import get_current_user
from ..services.supabase_client import supabase

router = APIRouter(prefix="/tests", tags=["tests"])

class TestSubmission(BaseModel):
    answers: Dict[str, str]

@router.get("/{session_id}")
async def get_test(session_id: str, user_id: str = Depends(get_current_user)):
    session = supabase.table("test_sessions").select("*").eq("id", session_id).single().execute()
    if not session.data:
        raise HTTPException(status_code=404, detail="Test session not found")
        
    if session.data["candidate_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this test")
        
    return {"questions": session.data["questions"]}

@router.post("/{session_id}/submit")
async def submit_test(session_id: str, submission: TestSubmission, user_id: str = Depends(get_current_user)):
    # 1. Fetch test
    session = supabase.table("test_sessions").select("*").eq("id", session_id).single().execute()
    if not session.data:
        raise HTTPException(status_code=404, detail="Test session not found")
        
    # 2. Grade conceptually (For hackathon, we assume 80% pass if they answer everything)
    questions = session.data["questions"]
    # Mocking grading logic for speed - in a real app, Agent 4 evaluates answers
    score = 85 # Dummy perfect score for passing the demo test
    
    # 3. Trigger Agent 4: Passport Issuer via the backend 
    from ..agents.graphs.passport_issuer_graph import create_passport_issuer_graph
    issuer_graph = create_passport_issuer_graph()
    
    issuer_state = {
        "candidate_id": user_id,
        "test_score": score,
        "passport_issued": False,
        "feedback": ""
    }
    
    result = issuer_graph.invoke(issuer_state)
    
    # Mark test as completed
    supabase.table("test_sessions").update({
        "status": "completed",
        "score": score
    }).eq("id", session_id).execute()

    return {
        "message": "Test submitted successfully",
        "score": score,
        "passport_issued": result.get("passport_issued", False)
    }
