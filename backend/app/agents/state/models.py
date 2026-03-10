from typing import List, Dict, Any, TypedDict
from langchain_core.messages import BaseMessage

class ResumeParserState(TypedDict):
    pdf_path: str
    raw_text: str
    extracted_skills: List[Dict[str, Any]]
    candidate_id: str

class TestGeneratorState(TypedDict):
    extracted_skills: List[Dict[str, Any]]
    candidate_id: str
    generated_questions: List[Dict[str, Any]]
    
class ProctoringState(TypedDict):
    session_id: str
    tab_switches: int
    clipboard_events: int
    question_timings: List[Dict[str, Any]]
    current_question_index: int
    anomaly_flags: List[str]

class PassportIssuerState(TypedDict):
    session_id: str
    candidate_id: str
    answers: List[Dict[str, Any]]
    correct_answers: List[Dict[str, Any]]
    score: float
    passed: bool
    proctoring_score: float
    extracted_skills: List[Dict[str, Any]]

class BotInterviewState(TypedDict):
    application_id: str
    job_description: str
    passport_skills: List[Dict[str, Any]]
    recruiter_mcqs: List[Dict[str, Any]]
    transcript: List[Dict[str, str]]
    current_phase: str
    question_count: int
    follow_up_depth: int

class SummarizerState(TypedDict):
    interview_session_id: str
    transcript: List[Dict[str, str]]
    passport_skills: List[Dict[str, Any]]
    job_description: str
    recruiter_mcqs: List[Dict[str, Any]]

class JobMatchingState(TypedDict):
    candidate_id: str
    passport_skills: List[Dict[str, Any]]
    all_active_jobs: List[Dict[str, Any]]
    ranked_jobs: List[Dict[str, Any]]
