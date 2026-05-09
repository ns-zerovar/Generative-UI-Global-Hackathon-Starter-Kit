"""LangChain tools for PawMind agent."""

from __future__ import annotations

import json
from datetime import date, datetime
from typing import Annotated, Any

from langchain_core.tools import tool

from pawmind_api.config import Settings
from pawmind_api.notion_store import NotionStore
from pawmind_api.notion_utils import record_to_embed_text
from pawmind_api.qdrant_store import QdrantMedicalStore


def build_tools(
    settings: Settings,
    notion: NotionStore,
    qdrant: QdrantMedicalStore,
) -> list[Any]:
    @tool("notion_medical_search")
    def notion_medical_search(
        query: Annotated[str, "Natural language query about symptoms, history, or diagnoses"],
    ) -> str:
        """Search medical records in Notion + vector memory. Returns relevant historical context."""
        notion_hits = notion.search_medical_text(query, limit=8)
        vec_hits = qdrant.similarity_search(query, limit=6)
        merged = []
        for row in notion_hits:
            merged.append({"source": "notion_keyword", "record": row})
        for row in vec_hits:
            if row.get("source") == "medical":
                merged.append({"source": "vector_medical", "record": row})
        if not merged:
            return "No matching medical records found in Notion/RAG. Recommend documenting visits in your Medical Records database."
        lines = []
        for i, item in enumerate(merged[:12], 1):
            lines.append(f"--- Match {i} ({item['source']}) ---\n{record_to_embed_text(item['record'])}")
        return "\n\n".join(lines)

    @tool("medication_schedule")
    def medication_schedule(
        question: Annotated[str, "User question about meds, e.g. frequency or next dose"],
    ) -> str:
        """List medications from Notion with schedule hints (dosage, frequency, dates)."""
        meds = notion.medications()
        if not meds:
            return "No medications found in Notion. Add rows to the Medications database."
        lines = []
        for m in meds[:25]:
            lines.append(record_to_embed_text(m))
        ctx = "\n".join(lines)
        today = date.today().isoformat()
        return f"As of {today}, medications on file:\n{ctx}\n\nAnswer the user's question using these rows only: {question}"

    @tool("consultation_lookup")
    def consultation_lookup(
        question: Annotated[str, "Question about past or upcoming vet visits"],
    ) -> str:
        """Consultation dates, vet names, notes from Notion."""
        visits = notion.consultations()
        if not visits:
            return "No consultations in Notion. Add rows to the Consultations database."
        rows = "\n".join(record_to_embed_text(v) for v in visits[:25])
        return f"Consultations:\n{rows}\n\nUser question: {question}"

    @tool("symptom_analysis")
    def symptom_analysis(
        symptom_description: Annotated[str, "What the guardian observes, e.g. limping or itching"],
    ) -> str:
        """Cross-reference symptoms with historical orthopedic/skin records using Notion + vectors."""
        q = symptom_description
        hist = notion.search_medical_text(q, limit=10)
        vec = qdrant.similarity_search(q, limit=8)
        blob = "\n".join(record_to_embed_text(h) for h in hist)
        vblob = "\n".join(record_to_embed_text(h) for h in vec if h)
        return (
            f"Symptom report: {symptom_description}\n\n"
            f"Historical keyword matches:\n{blob or '(none)'}\n\n"
            f"Vector similarity context:\n{vblob or '(none)'}\n\n"
            "Summarize patterns (recurrence, prior surgeries) for the assistant. "
            "Always recommend a vet if pain, acute distress, orUnknown severity."
        )

    @tool("body_map_generator")
    def body_map_generator(
        focus_query: Annotated[
            str,
            "Optional filter e.g. surgery OR allergy — leave blank for all markers",
        ] = "",
    ) -> str:
        """Build structured markers for the interactive dog body map UI from recent medical records."""
        rows = notion.medical_records()
        markers: list[dict[str, Any]] = []
        severity_map = {"severe": "red", "high": "red", "moderate": "orange", "mild": "yellow", "resolved": "green"}
        for row in rows[:40]:
            raw_part = str(row.get("Body Part") or row.get("body part") or "").lower()
            part_norm = raw_part.replace(" ", "_") if raw_part else "general"
            sev = str(row.get("Severity") or row.get("severity") or "mild").lower()
            status = str(row.get("Status") or row.get("status") or "active").lower()
            color = severity_map.get(sev, "orange")
            if status == "resolved":
                color = "green"
            diag = row.get("Diagnosis") or row.get("diagnosis") or ""
            markers.append(
                {
                    "body_part": part_norm or "general",
                    "condition": str(diag)[:180],
                    "severity": sev or "unknown",
                    "status": status or "unknown",
                    "color_hint": color,
                    "date": row.get("Date") or row.get("date") or "",
                    "notes": (row.get("Vet Notes") or row.get("vet notes") or "")[:400],
                }
            )
        if focus_query:
            fq = focus_query.lower()
            markers = [m for m in markers if fq in json.dumps(m).lower()]
        return json.dumps({"markers": markers, "generated_at": datetime.utcnow().isoformat() + "Z"}, indent=2)

    # Bind settings for dog default name in docstrings context — tools stay pure
    _ = settings.default_dog_name

    return [
        notion_medical_search,
        medication_schedule,
        consultation_lookup,
        symptom_analysis,
        body_map_generator,
    ]
