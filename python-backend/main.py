from __future__ import annotations

import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from config import settings
from rag import rag_pipeline

logging.basicConfig(level=logging.INFO)


class QuestionRequest(BaseModel):
  question: str | None = Field(default=None, description="User farming question")
  query: str | None = Field(default=None, description="Alias for question")
  user_id: str | None = None


class AnswerSource(BaseModel):
  source: str
  start_index: int | None = None


class QuestionResponse(BaseModel):
  success: bool = True
  answer: str
  response: str
  sources: list[AnswerSource]


class IngestResponse(BaseModel):
  status: str
  documents_indexed: int
  source_path: str


def _get_question(payload: QuestionRequest) -> str:
  text = payload.question or payload.query or ""
  return text.strip()


app = FastAPI(
  title="Farm To Home AI Assistant API",
  description="FastAPI + LangChain + FAISS + Groq assistant for Farm To Home.",
)

app.add_middleware(
  CORSMiddleware,
  allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)


@app.get("/health", tags=["system"])
def health_check() -> dict:
  print('[python-backend] GET /health')
  return {
    "status": "ok",
    "farming_markdown_path": str(settings.farming_markdown_path),
  }


@app.post("/ingest", response_model=IngestResponse, tags=["rag"])
def ingest_farming_data() -> IngestResponse:
  print('[python-backend] POST /ingest')
  try:
    result = rag_pipeline.ingest()
  except FileNotFoundError as exc:
    print('[python-backend] ingest failed', str(exc))
    raise HTTPException(status_code=400, detail=str(exc))

  print('[python-backend] ingest success', result)
  return IngestResponse(**result)


def _ask_farming_question(payload: QuestionRequest) -> QuestionResponse:
  question = _get_question(payload)
  print('[python-backend] chat request received', {
    'has_question': bool(question),
    'question_length': len(question),
    'user_id': payload.user_id,
  })

  if not question:
    print('[python-backend] chat rejected: empty question')
    raise HTTPException(status_code=400, detail="Question cannot be empty.")

  try:
    result = rag_pipeline.ask(question)
  except FileNotFoundError as exc:
    print('[python-backend] chat failed: missing file', str(exc))
    raise HTTPException(status_code=400, detail=str(exc))
  except ValueError as exc:
    print('[python-backend] chat failed: value error', str(exc))
    raise HTTPException(status_code=500, detail=str(exc))

  print('[python-backend] chat success', {
    'response_length': len(result.get('response') or ''),
    'source_count': len(result.get('sources') or []),
  })
  return QuestionResponse(
    success=True,
    answer=result["answer"],
    response=result["response"],
    sources=[AnswerSource(**source) for source in result["sources"]],
  )


@app.post("/chat", response_model=QuestionResponse, tags=["rag"])
def ask_expert(payload: QuestionRequest) -> QuestionResponse:
  print('[python-backend] POST /chat')
  return _ask_farming_question(payload)


@app.post("/api/rag/chat", response_model=QuestionResponse, tags=["rag"])
def ask_expert_compat(payload: QuestionRequest) -> QuestionResponse:
  print('[python-backend] POST /api/rag/chat')
  return _ask_farming_question(payload)
