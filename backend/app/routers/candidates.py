import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from ..services.auth_middleware import get_current_user
from ..services.supabase_client import supabase
from ..agents.graphs.resume_parser_graph import create_resume_parser_graph
from ..agents.graphs.test_generator_graph import create_test_generator_graph

router = APIRouter(prefix="/candidates", tags=["candidates"])

STORAGE_PATH = os.environ.get("RESUME_STORAGE_PATH", "./storage/resumes")

@router.get("/profile")
async def get_profile(user_id: str = Depends(get_current_user)):
    profile = supabase.table("candidates").select("*, profiles(full_name, email, phone)").eq("id", user_id).single().execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
    return profile.data

@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...), user_id: str = Depends(get_current_user)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    os.makedirs(STORAGE_PATH, exist_ok=True)
    file_path = os.path.join(STORAGE_PATH, f"{user_id}_{file.filename}")
    
    # Save local file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {e}")
        
    # Update Supabase
    supabase.table("candidates").update({"resume_path": file_path}).eq("id", user_id).execute()
    
    # Trigger Agent 1: Resume Parser
    parser_graph = create_resume_parser_graph()
    parser_state = {"pdf_path": file_path, "candidate_id": user_id, "raw_text": "", "extracted_skills": []}
    parser_result = parser_graph.invoke(parser_state)
    skills = parser_result.get("extracted_skills", [])
    
    # Trigger Agent 2: Test Generator
    test_graph = create_test_generator_graph()
    test_state = {"extracted_skills": skills, "candidate_id": user_id, "generated_questions": []}
    test_result = test_graph.invoke(test_state)
    questions = test_result.get("generated_questions", [])
    
    # Fetch the session ID we just created in test_generator_graph
    # We fetch the latest pending test session for this user
    session_res = supabase.table("test_sessions").select("id").eq("candidate_id", user_id).order("created_at", desc=True).limit(1).execute()
    session_id = session_res.data[0]["id"] if session_res.data else None

    return {
        "message": "Resume parsed and test generated successfully", 
        "path": file_path, 
        "skills_extracted": len(skills),
        "test_session_id": session_id
    }

@router.get("/passport")
async def get_passport(user_id: str = Depends(get_current_user)):
    passport = supabase.table("skill_passports").select("*").eq("candidate_id", user_id).order("issued_at", desc=True).limit(1).execute()
    if not passport.data:
        return {"passport": None}
    return {"passport": passport.data[0]}
