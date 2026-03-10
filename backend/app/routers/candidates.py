import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from ..services.auth_middleware import get_current_user
from ..services.supabase_client import supabase

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
    
    # In a real impl, this would trigger Agent 1 (Resume Parser Graph) asynchronously here.
    
    return {"message": "Resume uploaded successfully", "path": file_path}

@router.get("/passport")
async def get_passport(user_id: str = Depends(get_current_user)):
    passport = supabase.table("skill_passports").select("*").eq("candidate_id", user_id).order("issued_at", desc=True).limit(1).execute()
    if not passport.data:
        return {"passport": None}
    return {"passport": passport.data[0]}
