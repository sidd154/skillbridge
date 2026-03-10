from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from typing import List, Dict, Any
from pydantic import BaseModel, Field

llm = ChatOpenAI(model="gpt-4o", temperature=0.1)

class ExtractedSkill(BaseModel):
    skill_name: str
    category: str = Field(description="Must be one of: Frontend, Backend, Data Science, DevOps, Design, Management, Free-form")
    proficiency_claimed: str = Field(description="beginner, intermediate, or advanced")
    years_of_experience_claimed: int

class ParsedSkillsOutput(BaseModel):
    skills: List[ExtractedSkill]

parser = JsonOutputParser(pydantic_object=ParsedSkillsOutput)

resume_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are an expert technical recruiter AI.
Extract all technical and professional skills from the following resume text.
Map each skill to the closest predefined category: Frontend, Backend, Data Science, DevOps, Design, Management.
If a skill doesn't fit any category, assign it to 'Free-form'.
Determine the claimed proficiency level (beginner, intermediate, advanced) based on context (e.g., 'Expert in Python' -> advanced). Defaults to intermediate if unclear.
Extract years of experience claimed for the skill if mentioned, else 0.
Return the output as structured JSON.
\nFormatting Instructions:\n{format_instructions}"""),
    ("user", "Resume Text:\n{raw_text}")
])

def extract_skills_from_text(raw_text: str) -> List[Dict[str, Any]]:
    chain = resume_prompt | llm | parser
    try:
        res = chain.invoke({
            "raw_text": raw_text,
            "format_instructions": parser.get_format_instructions()
        })
        return res.get("skills", [])
    except Exception as e:
        print(f"LLM Parsing error: {e}")
        return []
