from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from typing import Dict, Any, Tuple
import json

llm = ChatOpenAI(model="gpt-4o", temperature=0.7)

intro_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are evaluating a candidate for '{job_title}'. 
Based on their Skill Passport, start a warm professional interview and ask the first opening question."""),
    ("user", "Job Desc: {desc}\nSkills: {skills}")
])

def generate_opening(job_title: str, job_desc: str, skills: list) -> str:
    res = (intro_prompt | llm).invoke({
        "job_title": job_title, 
        "desc": job_desc,
        "skills": json.dumps(skills)
    })
    return res.content

def analyze_and_next_question(transcript: list, phase: str, questions: list) -> Tuple[str, str]:
    # Mocking real complexity: usually we'd pass the entire history
    msgs = [SystemMessage(content=f"You are the technical interviewer in the {phase} phase.")]
    
    for t in transcript:
        if t["speaker"] == "bot":
            msgs.append(AIMessage(content=t["text"]))
        else:
            msgs.append(HumanMessage(content=t["text"]))
            
    msgs.append(SystemMessage(content="Evaluate the candidate's last answer. Then generate the VERY NEXT question to ask based on the current phase requirements."))
    
    res = llm.invoke(msgs)
    
    # We simplified the structured extraction of 'analysis' vs 'next_question' for speed.
    return "strong", res.content
