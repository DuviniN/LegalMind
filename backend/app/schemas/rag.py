from pydantic import BaseModel, Field


class RAGQueryRequest(BaseModel):
    question: str = Field(..., min_length=3, description="User question for retrieval-augmented generation")
    top_k: int = Field(default=4, ge=1, le=10, description="Number of chunks to retrieve")
    document_id: str | None = Field(default=None, description="Optional document id to restrict retrieval")


class RAGSource(BaseModel):
    file_name: str
    page_number: int | None = None
    chunk_index: int | None = None
    document_id: str | None = None


class RAGQueryResponse(BaseModel):
    user_id: str
    question: str
    answer: str
    sources: list[str] = Field(default_factory=list)
    source_details: list[RAGSource] = Field(default_factory=list)
    confidence: str = Field(description="high | medium | low")
    timestamp: str


class ChatHistoryItem(BaseModel):
    id: str
    user_id: str
    question: str
    answer: str
    sources: list[str] = Field(default_factory=list)
    confidence: str
    timestamp: str | None = None


class ChatHistoryResponse(BaseModel):
    history: list[ChatHistoryItem] = Field(default_factory=list)