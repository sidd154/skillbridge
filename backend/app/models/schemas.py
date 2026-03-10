from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

# --- Enums ---
class UserRole(str, Enum):
    candidate = "candidate"
    recruiter = "recruiter"

class ApplicationSource(str, Enum):
    candidate_applied = "candidate_applied"
    recruiter_headhunted = "recruiter_headhunted"

class ApplicationStatus(str, Enum):
    applied = "applied"
    mcq_pending = "mcq_pending"
    mcq_done = "mcq_done"
    interview_pending = "interview_pending"
    interview_done = "interview_done"
    reviewed = "reviewed"
    accepted = "accepted"
    rejected = "rejected"

class InterviewStatus(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"

class HeadhuntStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"

# --- Common Request/Response Models ---
class BaseProfile(BaseModel):
    id: str
    role: UserRole
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    created_at: Optional[datetime] = None

# --- Candidate Models ---
class CandidateRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    college: Optional[str] = None
    graduation_year: Optional[int] = None
    degree: Optional[str] = None

class CandidateProfile(BaseProfile):
    college: Optional[str] = None
    graduation_year: Optional[int] = None
    degree: Optional[str] = None
    resume_path: Optional[str] = None
    passport_id: Optional[str] = None

# --- Recruiter Models ---
class RecruiterRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    company_name: str
    company_size: Optional[str] = None
    designation: Optional[str] = None

class RecruiterProfile(BaseProfile):
    company_name: str
    company_domain: str
    company_size: Optional[str] = None
    designation: Optional[str] = None
    is_verified: bool = False

# --- Passport & Skills ---
class SkillClaim(BaseModel):
    skill_name: str
    category: str
    verified: bool = False
    proficiency_level: str # beginner/intermediate/advanced

class SkillPassportResponse(BaseModel):
    id: str
    candidate_id: str
    skills: List[SkillClaim]
    proctoring_score: Optional[float] = None
    issued_at: datetime
    expires_at: datetime
    is_active: bool

# --- Jobs ---
class JobPostRequest(BaseModel):
    title: str
    description: str
    location: Optional[str] = None
    job_type: str # remote/hybrid/onsite
    required_skills: List[str]
    min_experience_years: int = 0

class JobResponse(JobPostRequest):
    id: str
    recruiter_id: str
    is_active: bool
    created_at: datetime
