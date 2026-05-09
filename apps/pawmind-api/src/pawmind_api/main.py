"""PawMind FastAPI entrypoint."""

from __future__ import annotations

import json
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from pawmind_api.agent_runner import stream_agent_answer
from pawmind_api.config import get_settings
from pawmind_api.document_extract import chunk_sections, extract_docx, extract_pdf, heuristic_fields
from pawmind_api.notion_store import NotionStore
from pawmind_api.qdrant_store import QdrantMedicalStore
from pawmind_api.rag_sync import full_resync

app = FastAPI(title="PawMind API", version="0.1.0")
_settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=_settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(default_factory=list)
    message: str


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "pawmind-api"}


@app.post("/chat/stream")
async def chat_stream(body: ChatRequest):
    if not _settings.openai_api_key:
        raise HTTPException(503, "OPENAI_API_KEY is not configured")

    history = [{"role": m.role, "content": m.content} for m in body.messages]

    async def gen():
        try:
            async for piece in stream_agent_answer(_settings, history, body.message):
                if piece:
                    yield piece
        except Exception as e:
            yield f"\n\n_Error: {e}_"

    return StreamingResponse(gen(), media_type="text/plain; charset=utf-8")


@app.post("/sync/notion-to-qdrant")
def sync_notion_to_qdrant() -> dict[str, Any]:
    if not _settings.openai_api_key:
        raise HTTPException(503, "OPENAI_API_KEY required for embeddings")
    counts = full_resync(_settings)
    return {"ok": True, "upserted": counts}


@app.post("/ingest/document")
async def ingest_document(file: UploadFile = File(...)) -> dict[str, Any]:
    if not _settings.notion_token or not _settings.notion_medical_database_id:
        raise HTTPException(503, "Notion medical database not configured")
    raw = await file.read()
    name = file.filename or "upload"
    if name.lower().endswith(".pdf"):
        text = extract_pdf(raw)
    elif name.lower().endswith(".docx"):
        text = extract_docx(raw)
    else:
        raise HTTPException(400, "Only PDF and DOCX are supported")

    notion = NotionStore(_settings)
    qdrant = QdrantMedicalStore(_settings)
    created_pages = 0
    embedded_chunks = 0
    for chunk in chunk_sections(text):
        fields = heuristic_fields(chunk)
        title = f"Import — {name}"[:90]
        props: dict[str, Any] = {
            "Name": {"title": [{"text": {"content": title}}]},
        }
        if fields.get("Vet Notes"):
            props["Vet Notes"] = {"rich_text": [{"text": {"content": fields["Vet Notes"][:1900]}}]}
        if fields.get("Symptoms"):
            props["Symptoms"] = {"rich_text": [{"text": {"content": fields["Symptoms"][:1900]}}]}
        if fields.get("Medications"):
            props["Medications"] = {"rich_text": [{"text": {"content": fields["Medications"][:1900]}}]}
        try:
            page = notion.create_medical_import(props)
            if page:
                created_pages += 1
                rec = {"page_id": page["id"], **{k: fields.get(k) for k in fields}}
                embedded_chunks += qdrant.upsert_records([rec], source="ingest")
        except Exception:
            continue

    return {"ok": True, "pages_created": created_pages, "chunks_embedded": embedded_chunks}


@app.get("/dashboard/summary")
def dashboard_summary() -> dict[str, Any]:
    notion = NotionStore(_settings)
    dogs = notion.dogs()
    meds = notion.medications()
    consults = notion.consultations()
    medical = notion.medical_records()
    return {
        "dogs": dogs[:5],
        "medications": meds[:12],
        "consultations": consults[:12],
        "recent_medical": medical[:10],
        "alerts": [
            "PawMind does not diagnose. Seek a veterinarian for emergencies.",
        ],
    }


@app.get("/body-map/markers")
def body_map_markers() -> dict[str, Any]:
    notion = NotionStore(_settings)
    rows = notion.medical_records()
    markers: list[dict[str, Any]] = []
    for row in rows[:50]:
        raw_part = str(row.get("Body Part") or "").lower().replace(" ", "_") or "general"
        sev = str(row.get("Severity") or "mild").lower()
        status = str(row.get("Status") or "active").lower()
        color = "red" if sev in ("severe", "high") else "orange" if sev == "moderate" else "yellow"
        if status == "resolved":
            color = "green"
        markers.append(
            {
                "body_part": raw_part,
                "condition": str(row.get("Diagnosis") or "")[:160],
                "severity": sev,
                "status": status,
                "color": color,
                "date": row.get("Date") or "",
                "notes": str(row.get("Vet Notes") or "")[:320],
            }
        )
    return {"markers": markers}


@app.get("/dog/profile")
def dog_profile() -> dict[str, Any]:
    notion = NotionStore(_settings)
    dogs = notion.dogs()
    return {"profiles": dogs[:3]}


@app.post("/body-map/markers/parse")
async def body_map_parse(payload: dict[str, Any]) -> dict[str, Any]:
    """Allow agent/UI to push structured markers."""
    markers = payload.get("markers")
    if isinstance(markers, list):
        return {"markers": markers}
    raise HTTPException(400, "markers array required")


class PreviewMarkersBody(BaseModel):
    query: str = ""


@app.post("/body-map/preview")
def body_map_preview(body: PreviewMarkersBody) -> dict[str, Any]:
    """Run body_map_generator logic server-side for demos."""
    from pawmind_api.tools import build_tools

    notion = NotionStore(_settings)
    qdrant = QdrantMedicalStore(_settings)
    tools = build_tools(_settings, notion, qdrant)
    tool = next(t for t in tools if t.name == "body_map_generator")
    raw = tool.invoke({"focus_query": body.query})
    try:
        return json.loads(str(raw))
    except json.JSONDecodeError:
        return {"markers": [], "raw": raw}

