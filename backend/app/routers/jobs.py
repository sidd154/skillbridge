from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ..models.schemas import JobPostRequest
from ..services.auth_middleware import get_current_user
from ..services.supabase_client import supabase

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.post("/")
async def create_job(req: JobPostRequest, user_id: str = Depends(get_current_user)):
    # Check if recruiter is verified
    recruiter = supabase.table("recruiters").select("is_verified").eq("id", user_id).single().execute()
    if not recruiter.data or not recruiter.data.get("is_verified"):
        raise HTTPException(status_code=403, detail="Only verified recruiters can post jobs")
        
    try:
        new_job = supabase.table("jobs").insert({
            "recruiter_id": user_id,
            "title": req.title,
            "description": req.description,
            "location": req.location,
            "job_type": req.job_type,
            "required_skills": req.required_skills,
            "min_experience_years": req.min_experience_years
        }).execute()
        return {"message": "Job posted successfully", "job_id": new_job.data[0]['id']}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/")
async def list_active_jobs(user_id: str = Depends(get_current_user)):
    # Note: Requires active passport in real world logic before Candidate can view
    jobs = supabase.table("jobs").select("*, recruiters(company_name)").eq("is_active", True).execute()
    return {"jobs": jobs.data}

@router.post("/{job_id}/apply")
async def apply_to_job(job_id: str, user_id: str = Depends(get_current_user)):
    # Ensure they are a candidate
    profile = supabase.table("profiles").select("role").eq("id", user_id).single().execute()
    if not profile.data or profile.data.get("role") != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can apply")
        
    # Ensure they have an active passport
    passport = supabase.table("skill_passports").select("id").eq("candidate_id", user_id).eq("is_active", True).execute()
    if not passport.data:
        raise HTTPException(status_code=403, detail="Active Skill Passport required to apply")
        
    try:
        app = supabase.table("applications").insert({
            "job_id": job_id,
            "candidate_id": user_id,
            "source": "candidate_applied"
        }).execute()
        return {"message": "Application submitted", "application_id": app.data[0]['id']}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Could not apply. Maybe already applied?")
