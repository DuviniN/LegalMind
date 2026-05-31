"""HTTP proxy that delegates agent work to the legalmind-agent server."""

from app.services.agent_client import agent_post_json


async def handle_agent_query(
    *,
    company_id: str,
    user_id: str,
    message: str,
    top_k: int = 4,
    document_id: str | None = None,
    leave_draft: dict[str, str] | None = None,
) -> dict:
    payload = {
        "company_id": company_id,
        "user_id": user_id,
        "message": message,
        "top_k": top_k,
        "document_id": document_id,
        "leave_draft": leave_draft,
    }
    return await agent_post_json("/agent/query", payload)


__all__ = ["handle_agent_query"]



