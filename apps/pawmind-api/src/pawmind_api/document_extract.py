"""Extract plain text from PDF / DOCX for ingestion."""

from __future__ import annotations

import io
import re
from typing import Any

from docx import Document
from pypdf import PdfReader


def extract_pdf(data: bytes) -> str:
    reader = PdfReader(io.BytesIO(data))
    parts: list[str] = []
    for page in reader.pages:
        t = page.extract_text() or ""
        if t.strip():
            parts.append(t)
    return "\n".join(parts).strip()


def extract_docx(data: bytes) -> str:
    doc = Document(io.BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip()).strip()


def chunk_sections(text: str, max_chars: int = 1200) -> list[str]:
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= max_chars:
        return [text] if text else []
    chunks: list[str] = []
    start = 0
    while start < len(text):
        chunks.append(text[start : start + max_chars])
        start += max_chars
    return chunks


def heuristic_fields(chunk: str) -> dict[str, Any]:
    """Light structure hints for Notion medical rows (demo heuristic)."""
    lower = chunk.lower()
    symptoms = []
    for kw in ("limp", "scratch", "cough", "vomit", "diarrhea", "pain", "swollen"):
        if kw in lower:
            symptoms.append(kw)
    meds = []
    for m in re.findall(r"(\d+\s*mg\s+[a-zA-Z]+|[a-zA-Z]+\s+\d+\s*mg)", chunk):
        meds.append(m)
    return {
        "Symptoms": ", ".join(symptoms) if symptoms else "",
        "Vet Notes": chunk[:2000],
        "Medications": ", ".join(meds[:5]),
        "Diagnosis": "",
        "Body Part": "",
        "Severity": "mild" if symptoms else "",
        "Date": "",
    }
