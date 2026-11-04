from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.config import settings
from app.db import Base, engine, get_db, SessionLocal
from app.models import User
from app.security import hash_password, verify_password, create_access_token, get_current_user, require_hr_admin
from app.schemas import ChatRequest, ChatResponse, IngestResponse
from app.rag import answer_question, ingest_documents, DATA_DIR

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    # Seed demo users only if the users table is empty.
    # Replace the example passwords in .env before first launch.
    with SessionLocal() as db:
        if db.query(User).count() == 0:
            db.add_all([
                User(username=settings.seed_admin_username,
                     password_hash=hash_password(settings.seed_admin_password),
                     role="hr_admin"),
                User(username=settings.seed_employee_username,
                     password_hash=hash_password(settings.seed_employee_password),
                     role="employee", employee_id="EMP-DEMO-001"),
            ])
            db.commit()
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    yield

app = FastAPI(title="HR & Employee RAG API", version="1.0.0", lifespan=lifespan)

# Restrict this to your actual frontend origin before deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

@app.get("/")
def root():
    return {"message": "HR RAG API is running", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "ok", "llm_model": settings.llm_model, "embedding_model": settings.embed_model}

@app.post("/auth/token")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form.username).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    return {"access_token": create_access_token(user), "token_type": "bearer", "role": user.role}

@app.get("/auth/me")
def me(user: User = Depends(get_current_user)):
    return {"id": user.id, "username": user.username, "role": user.role, "employee_id": user.employee_id}

@app.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest, user: User = Depends(get_current_user)):
    # Role comes from the database-backed authenticated identity, never from request JSON.
    try:
        return answer_question(payload.question, user.role)
    except Exception as exc:
        # Avoid returning internal exception details to users.
        raise HTTPException(status_code=503, detail="RAG service failed. Check Ollama, ChromaDB, and backend logs.") from exc

@app.post("/admin/ingest", response_model=IngestResponse)
def ingest(_: User = Depends(require_hr_admin)):
    try:
        chunks, files = ingest_documents()
        return IngestResponse(
            indexed_chunks=chunks,
            files_processed=files,
            message="Document ingestion completed."
        )
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Document ingestion failed. Check backend logs.") from exc
