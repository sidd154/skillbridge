from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from typing import List, Dict, Any
from pydantic import BaseModel, Field
import json
from langgraph.graph import StateGraph, END
from ..state.models import SummarizerState
from ...services.supabase_client import supabase

llm = ChatOpenAI(model="gpt-4o", temperature=0.2)

class InterviewSummary(BaseModel):
    overall_score: int = Field(description="0-100 score")
    communication_score: int = Field(description="0-100 score on clarity/fluency")
    technical_score: int = Field(description="0-100 score on accuracy vs passport claims")
    red_flags: List[str] = Field(description="List of concerning moments")
    standout_moments: List[str] = Field(description="List of impressive answers")
    recommended_followup_questions: List[str] = Field(description="5 questions for human recruiter")

summary_parser = JsonOutputParser(pydantic_object=InterviewSummary)

summary_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are an expert technical hiring manager reviewing an AI bot interview transcript.
Analyze the transcript and score the candidate based on the job description and their skill passport claims.
Generate exactly 5 insightful follow-up questions the human recruiter should ask them.
Return structured JSON.
\nFormat:\n{format_instructions}"""),
    ("user", "Transcript:\n{transcript}\n\nJob:\n{job_desc}\n\nPassport Skills:\n{skills}")
])

def analyse_transcript_node(state: SummarizerState):
    chain = summary_prompt | llm | summary_parser
    try:
        res = chain.invoke({
            "transcript": json.dumps(state.get("transcript", [])),
            "job_desc": state.get("job_description", ""),
            "skills": json.dumps(state.get("passport_skills", [])),
            "format_instructions": summary_parser.get_format_instructions()
        })
        return {"_temp_summary": res}
    except Exception as e:
        print(f"Summarizer error: {e}")
        return {"_temp_summary": None}

def save_summary_node(state: SummarizerState):
    session_id = state.get("interview_session_id")
    summary = state.get("_temp_summary")
    
    if summary:
        try:
            supabase.table("interview_sessions").update({
                "summary": summary,
                "status": "completed"
            }).eq("id", session_id).execute()
        except Exception as e:
            print(f"Failed to save summary: {e}")
            
    return state

def notify_recruiter_node(state: SummarizerState):
    # Conceptual node: trigger a websocket ping or DB notification flag for recruiter UI
    print("Recruiter notified of completed interview.")
    return state

def create_summarizer_graph():
    workflow = StateGraph(SummarizerState)
    
    workflow.add_node("analyse_transcript", analyse_transcript_node)
    workflow.add_node("save_summary", save_summary_node)
    workflow.add_node("notify_recruiter", notify_recruiter_node)
    
    workflow.set_entry_point("analyse_transcript")
    workflow.add_edge("analyse_transcript", "save_summary")
    workflow.add_edge("save_summary", "notify_recruiter")
    workflow.add_edge("notify_recruiter", END)
    
    return workflow.compile()
