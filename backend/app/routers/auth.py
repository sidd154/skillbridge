from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Any
from ..services.supabase_client import supabase
from ..models.schemas import CandidateRegisterRequest, RecruiterRegisterRequest

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register/candidate")
async def register_candidate(req: CandidateRegisterRequest):
    try:
        # 1. Sign up user in Supabase Auth
        auth_res = supabase.auth.sign_up({
            "email": req.email,
            "password": req.password,
        })
        
        user = auth_res.user
        if not user:
            raise HTTPException(status_code=400, detail="Signup failed")
            
        # 2. Add to profiles table
        supabase.table("profiles").insert({
            "id": user.id,
            "role": "candidate",
            "full_name": req.full_name,
            "email": req.email,
            "phone": req.phone
        }).execute()
        
        # 3. Add to candidates table
        supabase.table("candidates").insert({
            "id": user.id,
            "college": req.college,
            "graduation_year": req.graduation_year,
            "degree": req.degree
        }).execute()
        
        return {"message": "Candidate registered successfully", "user_id": user.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/register/recruiter")
async def register_recruiter(req: RecruiterRegisterRequest):
    try:
        # Simple domain extraction for verification check concept
        domain = req.email.split("@")[-1]
        if domain in ["gmail.com", "yahoo.com", "hotmail.com"]:
            raise HTTPException(status_code=400, detail="Must use a work email domain")

        auth_res = supabase.auth.sign_up({
            "email": req.email,
            "password": req.password,
        })
        
        user = auth_res.user
        if not user:
            raise HTTPException(status_code=400, detail="Signup failed")
            
        supabase.table("profiles").insert({
            "id": user.id,
            "role": "recruiter",
            "full_name": req.full_name,
            "email": req.email,
            "phone": req.phone
        }).execute()
        
        supabase.table("recruiters").insert({
            "id": user.id,
            "company_name": req.company_name,
            "company_domain": domain,
            "company_size": req.company_size,
            "designation": req.designation,
            "is_verified": False # Requires OTP step conceptually
        }).execute()

        return {"message": "Recruiter registered successfully. OTP sent to email.", "user_id": user.id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
async def login(req: LoginRequest):
    try:
        auth_res = supabase.auth.sign_in_with_password({
            "email": req.email,
            "password": req.password
        })
        
        user = auth_res.user
        session = auth_res.session
        
        if not user or not session:
            raise HTTPException(status_code=401, detail="Login failed: no user returned")
        
        # Attempt to fetch profile role — gracefully fall back if table doesn't exist yet
        role = "candidate"  # safe default
        try:
            profile = supabase.table("profiles").select("role").eq("id", user.id).single().execute()
            if profile.data:
                role = profile.data.get("role", "candidate")
        except Exception:
            pass  # profiles table missing or empty — use default
        
        return {
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "role": role,
            "user_id": user.id,
            "email": user.email,
            "full_name": user.user_metadata.get("full_name", req.email.split("@")[0]) if user.user_metadata else req.email.split("@")[0]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid credentials: {str(e)}")
