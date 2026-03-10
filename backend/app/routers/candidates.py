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
    
    # Save file to disk
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {e}")
    
    # Ensure both profile and candidate records exist (fixes FK violations for test sessions)
    try:
        # 1. Check if Profile exists
        profile_check = supabase.table("profiles").select("id").eq("id", user_id).execute()
        if not profile_check.data:
            # Create a shell profile if missing (common for manual test users)
            email_prefix = file.filename.split('_')[0] if "_" in file.filename else "User"
            supabase.table("profiles").insert({
                "id": user_id, 
                "role": "candidate",
                "email": f"{user_id}@temp-skillbridge.ai", 
                "full_name": email_prefix
            }).execute()

        # 2. Ensure Candidate record exists and update resume_path
        supabase.table("candidates").upsert({"id": user_id, "resume_path": file_path}, on_conflict="id").execute()
    except Exception as e:
        print(f"Database Guard Error: {e}")
        # We continue anyway if it's just a 'duplicate' error, but stop for others
        if "duplicate" not in str(e).lower():
             raise HTTPException(status_code=500, detail=f"Database integrity guard failed: {str(e)}")
    
    # Trigger Agent 1: Resume Parser
    skills = []
    try:
        parser_graph = create_resume_parser_graph()
        parser_state = {"pdf_path": file_path, "candidate_id": user_id, "raw_text": "", "extracted_skills": []}
        parser_result = parser_graph.invoke(parser_state)
        skills = parser_result.get("extracted_skills", [])
        print(f"Agent 1 extracted {len(skills)} skills")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume parsing failed: {str(e)}")
    
    if not skills:
        raise HTTPException(status_code=422, detail="No skills could be extracted from the resume. Please upload a detailed technical resume.")
    
    # Trigger Agent 2: Test Generator
    session_id = None
    try:
        test_graph = create_test_generator_graph()
        test_state = {"extracted_skills": skills, "candidate_id": user_id, "generated_questions": []}
        test_graph.invoke(test_state)
        
        # Fetch the session just created — order by id desc (UUID v4 is random, so grab the single last row)
        session_res = supabase.table("test_sessions").select("id").eq("candidate_id", user_id).limit(1).execute()
        session_id = session_res.data[0]["id"] if session_res.data else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test generation failed: {str(e)}")
    
    if not session_id:
        raise HTTPException(status_code=500, detail="Test session was not created. Ensure the Supabase schema (test_sessions table) has been applied.")
    
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
