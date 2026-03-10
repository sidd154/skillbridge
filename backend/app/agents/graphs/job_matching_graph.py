from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from typing import List, Dict, Any
from pydantic import BaseModel, Field
import json
from langgraph.graph import StateGraph, END
from ..state.models import JobMatchingState
from ...services.supabase_client import supabase

llm = ChatOpenAI(model="gpt-4o", temperature=0.1)

class RankedJob(BaseModel):
    job_id: str
    match_score: int = Field(description="0-100 match percentage")
    match_reason: str = Field(description="1 sentence explaining why this is a good fit")

class MatcherOutput(BaseModel):
    ranked_jobs: List[RankedJob]

matcher_parser = JsonOutputParser(pydantic_object=MatcherOutput)

matcher_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are an AI career match-maker. 
Compare the Candidate's verified Skill Passport against the list of Active Jobs.
Score each job from 0-100 based on skill overlap, required years of experience vs claimed, and proficiency match.
Omit jobs that are a terrible fit (< 30%).
Return the ranked list as JSON, highest score first.
\nFormat Instructions:\n{format_instructions}"""),
    ("user", "Candidate Skills:\n{skills}\n\nJobs List:\n{jobs}")
])

def load_jobs_node(state: JobMatchingState):
    # Already loaded via API in real app
    return state

def match_and_rank_node(state: JobMatchingState):
    jobs = state.get("all_active_jobs", [])
    skills = state.get("passport_skills", [])
    
    if not jobs or not skills:
        return {"ranked_jobs": []}
        
    chain = matcher_prompt | llm | matcher_parser
    try:
        res = chain.invoke({
            "skills": json.dumps(skills),
            "jobs": json.dumps(jobs),
            "format_instructions": matcher_parser.get_format_instructions()
        })
        return {"ranked_jobs": res.get("ranked_jobs", [])}
    except Exception as e:
        print(f"Matching error: {e}")
        return {"ranked_jobs": []}

def save_rankings_node(state: JobMatchingState):
    # Could cache to Redis or DB, returning state for now
    return state

def create_job_matching_graph():
    workflow = StateGraph(JobMatchingState)
    
    workflow.add_node("load_jobs", load_jobs_node)
    workflow.add_node("match_and_rank", match_and_rank_node)
    workflow.add_node("save_rankings", save_rankings_node)
    
    workflow.set_entry_point("load_jobs")
    workflow.add_edge("load_jobs", "match_and_rank")
    workflow.add_edge("match_and_rank", "save_rankings")
    workflow.add_edge("save_rankings", END)
    
    return workflow.compile()
