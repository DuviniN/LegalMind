from pydantic import BaseModel


class DocumentItem(BaseModel):
    id: str
    file_name: str
    path: str
    uploaded_at: str | None = None


class DocumentListResponse(BaseModel):
    documents: list[DocumentItem]
