from typing import Optional

from fastapi import APIRouter, Depends, Query

from app.api.dependencies import get_chat_company
from app.schemas.rag import ChatHistoryResponse, RAGQueryRequest, RAGQueryResponse
from app.services.rag_service import ask_question_from_rag, get_chat_history

router = APIRouter(tags=["rag"])


@router.post("/rag/query", response_model=RAGQueryResponse)
async def query_rag(payload: RAGQueryRequest, company: dict = Depends(get_chat_company)):
    return await ask_question_from_rag(
        question=payload.question,
        company_id=str(company["_id"]),
        user_id=str(company["_id"]),
        top_k=payload.top_k,
        document_id=payload.document_id,
    )


@router.get("/history", response_model=ChatHistoryResponse)
async def history(
    user_id: Optional[str] = Query(default=None, description="Optional user id filter"),
    company: dict = Depends(get_chat_company),
):
    items = await get_chat_history(company_id=str(company["_id"]), user_id=user_id)
    return {"history": items}