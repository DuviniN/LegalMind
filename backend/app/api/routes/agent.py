from fastapi import APIRouter, Depends

from app.api.dependencies import get_chat_company
from app.schemas.agent import AgentQueryRequest, AgentQueryResponse
from app.services.agent_service import handle_agent_query

router = APIRouter(tags=["agent"])


@router.post("/agent/query", response_model=AgentQueryResponse)
async def agent_query(payload: AgentQueryRequest, company: dict = Depends(get_chat_company)):
    result = await handle_agent_query(
        company_id=str(company["_id"]),
        user_id=str(company["_id"]),
        message=payload.message,
        top_k=payload.top_k,
        document_id=payload.document_id,
        leave_draft=payload.leave_draft,
    )
    return result
