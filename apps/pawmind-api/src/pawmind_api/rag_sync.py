"""Sync Notion rows into Qdrant for embedding search."""

from __future__ import annotations

from pawmind_api.config import Settings
from pawmind_api.notion_store import NotionStore
from pawmind_api.qdrant_store import QdrantMedicalStore


def full_resync(settings: Settings) -> dict[str, int]:
    notion = NotionStore(settings)
    qdrant = QdrantMedicalStore(settings)
    counts = {}
    for label, rows in (
        ("medical", notion.medical_records()),
        ("medications", notion.medications()),
        ("consultations", notion.consultations()),
        ("dogs", notion.dogs()),
    ):
        counts[label] = qdrant.upsert_records(rows, source=label)
    return counts
