"""LegalMind LangGraph entrypoint moved out of the backend."""

from __future__ import annotations

import json
import re
from typing import Any, TypedDict

from fastapi import HTTPException
from langchain_groq import ChatGroq
from langgraph.graph import END, StateGraph

from simple_agent.core.config import settings
from simple_agent.services.rag_service import ask_question_from_rag
from simple_agent.tools.leave_tool import leave_tool


class AgentState(TypedDict, total=False):
    company_id: str
    user_id: str
    message: str
    top_k: int
    document_id: str | None
    leave_draft: dict[str, str] | None

    intent: str
    rag: dict | None
    leave: dict | None
    assistant_message: str


_router_llm: ChatGroq | None = None
_agent_graph = None


def _get_router_llm() -> ChatGroq:
    global _router_llm
    if _router_llm is None:
        if not settings.groq_api_key:
            raise HTTPException(status_code=500, detail="Missing GROQ_API_KEY in legalmind-agent .env")
        _router_llm = ChatGroq(
            api_key=settings.groq_api_key,
            model=settings.groq_model_name or "llama-3.3-70b-versatile",
            temperature=0.0,
        )
    return _router_llm


def _safe_json_loads(text: str) -> dict[str, Any] | None:
    raw = (text or "").strip()
    if not raw:
        return None

    match = re.search(r"```json\s*(.*?)\s*```", raw, flags=re.IGNORECASE | re.DOTALL)
    if match:
        raw = match.group(1).strip()

    try:
        value = json.loads(raw)
    except Exception:
        return None

    return value if isinstance(value, dict) else None


def _heuristic_intent(message: str) -> str:
    value = (message or "").lower()
    if re.search(r"\bleave\b|short\s*leave|day\s*off|half\s*day|time\s*off|permission", value):
        return "leave_request"
    return "policy_query"


async def classify_intent(message: str, has_leave_draft: bool) -> str:
    """LLM intent router: policy_query vs leave_request."""
    if has_leave_draft:
        return "leave_request"

    prompt = (
        "You are an intent router for an HR + policy assistant. "
        "Classify the user message into exactly one intent: 'policy_query' or 'leave_request'. "
        "Return ONLY valid JSON like {\"intent\": \"policy_query\"}. "
        "\n\n"
        "policy_query: user asks about company rules, policies, benefits, procedures, compliance, working hours, etc. "
        "leave_request: user wants to apply/request/take leave or short leave, or asks how to apply for leave. "
        "\n\n"
        f"User message: {message}"
    )

    try:
        response = _get_router_llm().invoke(prompt)
        payload = _safe_json_loads(getattr(response, "content", "") or "")
        intent = (payload or {}).get("intent")
        if intent in {"policy_query", "leave_request"}:
            return intent
    except Exception:
        pass

    return _heuristic_intent(message)


async def _classify_node(state: AgentState) -> AgentState:
    message = (state.get("message") or "").strip()
    intent = await classify_intent(message, bool(state.get("leave_draft")))
    return {"intent": intent}


def _route_from_intent(state: AgentState) -> str:
    return "leave" if state.get("intent") == "leave_request" else "rag"


async def _leave_node(state: AgentState) -> AgentState:
    try:
        leave_response = await leave_tool.submit(
            company_id=state["company_id"],
            message=state["message"],
            draft=state.get("leave_draft") or {},
        )
    except HTTPException as exc:
        message = str(exc.detail) if getattr(exc, "detail", None) else "Leave service is temporarily unavailable."
        return {
            "leave": {
                "status": "unavailable",
                "message": message,
                "missing_fields": [],
                "request": None,
                "draft": state.get("leave_draft") or {},
                "next_question": None,
            },
            "rag": None,
            "assistant_message": f"Leave request service is currently unavailable. {message}",
        }
    except Exception:
        return {
            "leave": {
                "status": "unavailable",
                "message": "Leave service is temporarily unavailable.",
                "missing_fields": [],
                "request": None,
                "draft": state.get("leave_draft") or {},
                "next_question": None,
            },
            "rag": None,
            "assistant_message": "Leave request service is currently unavailable. Please try again shortly.",
        }

    if leave_response.get("status") == "needs_more_info":
        assistant_message = (
            leave_response.get("next_question")
            or leave_response.get("message")
            or "Please provide the remaining leave details."
        )
    else:
        summary = (leave_response.get("request") or {}).get("summary")
        assistant_message = leave_response.get("message") or "Leave request submitted."
        if summary:
            assistant_message = f"{assistant_message}\n\nSummary: {summary}"

    return {
        "leave": leave_response,
        "rag": None,
        "assistant_message": assistant_message,
    }


async def _rag_node(state: AgentState) -> AgentState:
    try:
        rag_response = await ask_question_from_rag(
            question=state["message"],
            company_id=state["company_id"],
            user_id=state["user_id"],
            top_k=state.get("top_k", 4),
            document_id=state.get("document_id"),
        )
    except HTTPException as exc:
        message = str(exc.detail) if getattr(exc, "detail", None) else "RAG service is temporarily unavailable."
        return {
            "rag": None,
            "leave": None,
            "assistant_message": f"I could not process this policy query right now. {message}",
        }
    except Exception:
        return {
            "rag": None,
            "leave": None,
            "assistant_message": "I could not process this policy query right now. Please try again shortly.",
        }

    sources = rag_response.get("sources")
    source_line = f"\n\nSources: {', '.join(sources)}" if isinstance(sources, list) and sources else ""
    confidence = rag_response.get("confidence")
    confidence_line = f"\nConfidence: {confidence}" if confidence else ""
    assistant_message = f"{rag_response.get('answer') or 'No answer generated.'}{source_line}{confidence_line}"

    return {
        "rag": rag_response,
        "leave": None,
        "assistant_message": assistant_message,
    }


def _finalize_node(state: AgentState) -> AgentState:
    return {
        "intent": state.get("intent") or "policy_query",
        "assistant_message": state.get("assistant_message") or "No response generated.",
        "rag": state.get("rag"),
        "leave": state.get("leave"),
    }


def _get_agent_graph():
    global _agent_graph
    if _agent_graph is None:
        workflow = StateGraph(AgentState)
        workflow.add_node("classify", _classify_node)
        workflow.add_node("leave", _leave_node)
        workflow.add_node("rag", _rag_node)
        workflow.add_node("finalize", _finalize_node)

        workflow.set_entry_point("classify")
        workflow.add_conditional_edges(
            "classify",
            _route_from_intent,
            {
                "leave": "leave",
                "rag": "rag",
            },
        )
        workflow.add_edge("leave", "finalize")
        workflow.add_edge("rag", "finalize")
        workflow.add_edge("finalize", END)
        _agent_graph = workflow.compile()
    return _agent_graph


async def handle_agent_query(
    *,
    company_id: str,
    user_id: str,
    message: str,
    top_k: int = 4,
    document_id: str | None = None,
    leave_draft: dict[str, str] | None = None,
) -> dict:
    clean_message = (message or "").strip()
    if not clean_message:
        raise HTTPException(status_code=422, detail="Message cannot be empty")

    graph = _get_agent_graph()
    if not hasattr(graph, "ainvoke"):
        raise HTTPException(
            status_code=500,
            detail="LangGraph async execution is not available. Please upgrade the 'langgraph' package.",
        )

    result: AgentState = await graph.ainvoke(
        {
            "company_id": company_id,
            "user_id": user_id,
            "message": clean_message,
            "top_k": top_k,
            "document_id": document_id,
            "leave_draft": leave_draft,
        }
    )

    return {
        "intent": result.get("intent") or "policy_query",
        "assistant_message": result.get("assistant_message") or "No response generated.",
        "rag": result.get("rag"),
        "leave": result.get("leave"),
    }


graph = _get_agent_graph()
