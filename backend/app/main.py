from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="SkillBridge API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, change to specific frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .routers import auth, candidates, recruiters, jobs, tests, websockets

app.include_router(auth.router)
app.include_router(candidates.router)
app.include_router(recruiters.router)
app.include_router(jobs.router)
app.include_router(tests.router)
app.include_router(websockets.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to SkillBridge API"}
