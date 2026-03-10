import json
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from typing import List, Dict, Any
from pydantic import BaseModel, Field

llm = ChatOpenAI(model="gpt-4o", temperature=0.7)

class MCQOption(BaseModel):
    A: str
    B: str
    C: str
    D: str

class MCQQuestion(BaseModel):
    question_id: str
    skill: str
    question_text: str
    options: MCQOption
    correct_answer: str = Field(description="Exactly one of: A, B, C, D")
    difficulty: str = Field(description="beginner, intermediate, or advanced")

class MCQOutput(BaseModel):
    questions: List[MCQQuestion]

mcq_parser = JsonOutputParser(pydantic_object=MCQOutput)

test_gen_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are an expert technical interviewer.
Generate a 20-question multiple choice test based on the candidate's extracted skills below.
Rules:
1. At least 2 questions per skill.
2. Question difficulty MUST match the claimed proficiency level for that skill (beginner/intermediate/advanced).
3. Exactly one correct answer (A, B, C, or D).
4. Do not make the correct answer guessable by pattern (e.g. don't make C always correct).
5. All questions must be unique.
Extracted Skills:
{skills_json}
\nFormatting Instructions:\n{format_instructions}"""),
])

def generate_questions_for_skills(skills: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    chain = test_gen_prompt | llm | mcq_parser
    try:
        res = chain.invoke({
            "skills_json": json.dumps(skills),
            "format_instructions": mcq_parser.get_format_instructions()
        })
        return res.get("questions", [])
    except Exception as e:
        print(f"Test Generation error: {e}")
        return []
