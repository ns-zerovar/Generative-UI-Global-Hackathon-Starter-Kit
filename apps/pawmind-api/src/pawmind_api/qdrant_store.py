"""Qdrant vector store for PawMind RAG."""

from __future__ import annotations

import uuid
from typing import Any

from langchain_openai import OpenAIEmbeddings
from qdrant_client import QdrantClient
from qdrant_client.http import models as qm

from pawmind_api.config import Settings
from pawmind_api.notion_utils import record_to_embed_text


class QdrantMedicalStore:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        kwargs: dict[str, Any] = {"url": settings.qdrant_url}
        if settings.qdrant_api_key:
            kwargs["api_key"] = settings.qdrant_api_key
        self._client = QdrantClient(**kwargs)
        self._embeddings = (
            OpenAIEmbeddings(
                api_key=settings.openai_api_key,
                model=settings.openai_embedding_model,
            )
            if settings.openai_api_key
            else None
        )

    def ensure_collection(self, vector_size: int = 1536) -> None:
        name = self._settings.qdrant_collection
        cols = self._client.get_collections().collections
        if any(c.name == name for c in cols):
            return
        self._client.create_collection(
            collection_name=name,
            vectors_config=qm.VectorParams(size=vector_size, distance=qm.Distance.COSINE),
        )

    def upsert_records(self, records: list[dict[str, Any]], source: str) -> int:
        if not self._embeddings:
            return 0
        self.ensure_collection()
        texts = [record_to_embed_text(r) for r in records]
        if not texts:
            return 0
        vectors = self._embeddings.embed_documents(texts)
        ns = uuid.UUID("019417ca-d517-789f-babc-ddcfd873184f")
        points = []
        for rec, vec in zip(records, vectors):
            pid = str(rec.get("page_id") or uuid.uuid4())
            point_id = str(uuid.uuid5(ns, f"{source}:{pid}"))
            payload = {"source": source, **rec}
            points.append(qm.PointStruct(id=point_id, vector=vec, payload=payload))
        self._client.upsert(collection_name=self._settings.qdrant_collection, points=points)
        return len(points)

    def similarity_search(self, query: str, limit: int = 8) -> list[dict[str, Any]]:
        if not self._embeddings:
            return []
        self.ensure_collection()
        vec = self._embeddings.embed_query(query)
        hits = self._client.search(
            collection_name=self._settings.qdrant_collection,
            query_vector=vec,
            limit=limit,
        )
        return [h.payload or {} for h in hits if h.payload]
