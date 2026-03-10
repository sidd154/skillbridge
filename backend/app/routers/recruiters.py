from fastapi import APIRouter, Depends, HTTPException
from ..services.auth_middleware import get_current_user
from ..services.supabase_client import supabase

router = APIRouter(prefix="/recruiters", tags=["recruiters"])

@router.get("/profile")
async def get_profile(user_id: str = Depends(get_current_user)):
    profile = supabase.table("recruiters").select("*, profiles(full_name, email, phone)").eq("id", user_id).single().execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Recruiter profile not found")
    return profile.data

@router.get("/talent-search")
async def talent_search(skills: str = "", user_id: str = Depends(get_current_user)):
    # Check verification
    recruiter = supabase.table("recruiters").select("is_verified").eq("id", user_id).single().execute()
    if not recruiter.data or not recruiter.data.get("is_verified"):
        raise HTTPException(status_code=403, detail="Recruiter must be verified to search talent")
        
    # Temporary simple search logic: grab all active passports.
    # A real implementation might use pg_trgm or Agent 7 logic.
    passports = supabase.table("skill_passports").select("*, candidates(profiles(full_name))").eq("is_active", True).execute()
    
    return {"results": passports.data}

@router.get("/jobs")
async def get_recruiter_jobs(user_id: str = Depends(get_current_user)):
    jobs = supabase.table("jobs").select("*").eq("recruiter_id", user_id).execute()
    return {"jobs": jobs.data}
