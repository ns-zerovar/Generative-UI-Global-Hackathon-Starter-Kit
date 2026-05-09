"""Serialize Notion rich properties into plain dicts for agents and RAG."""

from __future__ import annotations

from typing import Any


def _rich_text(rt: list[dict[str, Any]]) -> str:
    parts: list[str] = []
    for block in rt or []:
        t = block.get("plain_text") or ""
        if t:
            parts.append(t)
    return "".join(parts).strip()


def notion_prop_value(prop: dict[str, Any] | None) -> Any:
    if not prop:
        return None
    ptype = prop.get("type")
    if ptype == "title":
        return _rich_text(prop.get("title", []))
    if ptype == "rich_text":
        return _rich_text(prop.get("rich_text", []))
    if ptype == "number":
        return prop.get("number")
    if ptype == "select":
        s = prop.get("select") or {}
        return s.get("name")
    if ptype == "multi_select":
        return [x.get("name") for x in (prop.get("multi_select") or []) if x.get("name")]
    if ptype == "status":
        st = prop.get("status") or {}
        return st.get("name")
    if ptype == "date":
        d = prop.get("date") or {}
        return d.get("start")
    if ptype == "checkbox":
        return prop.get("checkbox")
    if ptype == "url":
        return prop.get("url")
    if ptype == "files":
        files = prop.get("files") or []
        return [f.get("file", {}).get("url") or f.get("external", {}).get("url") for f in files]
    if ptype == "relation":
        return [r.get("id") for r in (prop.get("relation") or [])]
    return str(prop)


def page_to_record(page: dict[str, Any]) -> dict[str, Any]:
    props = page.get("properties") or {}
    flat: dict[str, Any] = {"page_id": page.get("id")}
    for name, raw in props.items():
        flat[name] = notion_prop_value(raw)
    return flat


def record_to_embed_text(rec: dict[str, Any]) -> str:
    pairs = [f"{k}: {v}" for k, v in rec.items() if k != "page_id" and v not in (None, "", [])]
    return "\n".join(pairs)
