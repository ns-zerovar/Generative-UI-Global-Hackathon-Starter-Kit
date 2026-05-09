"""LangGraph ReAct agent with streaming."""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any

from langchain_core.messages import AIMessage, AIMessageChunk, BaseMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

from pawmind_api.config import Settings
from pawmind_api.notion_store import NotionStore
from pawmind_api.qdrant_store import QdrantMedicalStore
from pawmind_api.tools import build_tools

SYSTEM_PROMPT = """You are PawMind, an AI assistant that helps dog guardians organize and understand \
their companion's medical history stored in Notion.

RULES:
- You are NOT a veterinarian and must NEVER claim to be one.
- Always ground answers in retrieved Notion/RAG data when tools return content; if data is missing, say so.
- Recommend contacting a licensed veterinarian for diagnosis, emergencies, medication changes, or worsening symptoms.
- Keep tone calm, empathetic, and concise. Prefer bullet lists for schedules (meds, visits).
- After substantive medical-adjacent guidance, append a short disclaimer that this is informational only.

TOOLS: Use tools proactively when users ask about history, medications, visits, symptoms, or body-map visualization data.

Default guardian language: respond in the same language the user writes (Spanish or English)."""


def make_agent(settings: Settings):
    notion = NotionStore(settings)
    qdrant = QdrantMedicalStore(settings)
    tools = build_tools(settings, notion, qdrant)
    llm = ChatOpenAI(
        api_key=settings.openai_api_key,
        model=settings.openai_model,
        temperature=0.2,
        streaming=True,
    )
    graph = create_react_agent(llm, tools)
    return graph, notion, qdrant


async def stream_agent_answer(
    settings: Settings,
    history: list[dict[str, str]],
    user_message: str,
) -> AsyncIterator[str]:
    graph, _, _ = make_agent(settings)
    messages: list[BaseMessage] = [SystemMessage(content=SYSTEM_PROMPT)]
    for turn in history[-12:]:
        role = turn.get("role", "user")
        content = turn.get("content", "")
        if role == "assistant":
            messages.append(AIMessage(content=content))
        else:
            messages.append(HumanMessage(content=content))
    messages.append(HumanMessage(content=user_message))

    async for event in graph.astream_events(
        {"messages": messages},
        version="v2",
    ):
        kind = event.get("event")
        data = event.get("data") or {}
        if kind == "on_chat_model_stream":
            chunk: AIMessageChunk | None = data.get("chunk")
            if chunk and chunk.content:
                if isinstance(chunk.content, str):
                    yield chunk.content
                elif isinstance(chunk.content, list):
                    for part in chunk.content:
                        if isinstance(part, dict) and part.get("type") == "text":
                            yield part.get("text", "")
async def run_agent_sync(settings: Settings, history: list[dict[str, str]], user_message: str) -> str:
    graph, _, _ = make_agent(settings)
    messages: list[BaseMessage] = [SystemMessage(content=SYSTEM_PROMPT)]
    for turn in history[-12:]:
        role = turn.get("role", "user")
        content = turn.get("content", "")
        if role == "assistant":
            messages.append(AIMessage(content=content))
        else:
            messages.append(HumanMessage(content=content))
    messages.append(HumanMessage(content=user_message))
    final = await graph.ainvoke({"messages": messages})
    out_msgs: list[BaseMessage] = final.get("messages", [])
    if not out_msgs:
        return ""
    last = out_msgs[-1]
    if isinstance(last, AIMessage):
        return str(last.content)
    return str(last)
