"""Notion database reads — PawMind medical workspace."""

from __future__ import annotations

from typing import Any

from notion_client import Client

from pawmind_api.config import Settings
from pawmind_api.notion_utils import page_to_record, record_to_embed_text


class NotionStore:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client = Client(auth=settings.notion_token) if settings.notion_token else None

    @property
    def enabled(self) -> bool:
        return bool(self._client)

    def query_database(self, database_id: str, page_size: int = 50) -> list[dict[str, Any]]:
        if not self._client or not database_id:
            return []
        out: list[dict[str, Any]] = []
        cursor: str | None = None
        while True:
            kwargs: dict[str, Any] = {"database_id": database_id, "page_size": min(page_size, 100)}
            if cursor:
                kwargs["start_cursor"] = cursor
            resp = self._client.databases.query(**kwargs)
            for p in resp.get("results", []):
                out.append(page_to_record(p))
            if not resp.get("has_more"):
                break
            cursor = resp.get("next_cursor")
        return out

    def medical_records(self) -> list[dict[str, Any]]:
        return self.query_database(self._settings.notion_medical_database_id)

    def medications(self) -> list[dict[str, Any]]:
        return self.query_database(self._settings.notion_medications_database_id)

    def consultations(self) -> list[dict[str, Any]]:
        return self.query_database(self._settings.notion_consultations_database_id)

    def dogs(self) -> list[dict[str, Any]]:
        return self.query_database(self._settings.notion_dogs_database_id)

    def search_medical_text(self, query: str, limit: int = 12) -> list[dict[str, Any]]:
        """Cheap keyword filter over serialized rows (Notion search API is workspace-wide)."""
        q = query.lower()
        rows = self.medical_records()
        scored: list[tuple[int, dict[str, Any]]] = []
        for row in rows:
            blob = record_to_embed_text(row).lower()
            score = sum(1 for tok in q.split() if len(tok) > 2 and tok in blob)
            if score or q in blob:
                scored.append((score, row))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [r for _, r in scored[:limit]]

    def create_medical_import(self, properties_payload: dict[str, Any]) -> dict[str, Any] | None:
        """Create one row in the Medical Records database (property names must match workspace)."""
        if not self._client or not self._settings.notion_medical_database_id:
            return None
        return self._client.pages.create(
            parent={"database_id": self._settings.notion_medical_database_id},
            properties=properties_payload,
        )
