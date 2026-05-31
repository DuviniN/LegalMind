from pydantic import BaseModel, Field


class AgentQueryRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User message (policy question or leave request)")
    top_k: int = Field(default=4, ge=1, le=20, description="RAG top_k when intent=policy_query")
    document_id: str | None = Field(default=None, description="Optional document filter for RAG")
    leave_draft: dict[str, str] | None = Field(
        default=None,
        description="Existing leave draft state when continuing a leave request conversation",
    )


class AgentQueryResponse(BaseModel):
    intent: str = Field(description="policy_query | leave_request")
    assistant_message: str = Field(description="LLM-generated assistant message to display")
    rag: dict | None = None
    leave: dict | None = None
