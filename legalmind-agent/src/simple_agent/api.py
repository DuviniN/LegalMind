from __future__ import annotations

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from simple_agent.db.mongodb import close_mongo_connection, connect_to_mongo
from simple_agent.graph import handle_agent_query
from simple_agent.services.document_service import list_company_documents, upload_pdf
from simple_agent.services.leave_service import list_leave_requests


class AgentQueryRequest(BaseModel):
    company_id: str = Field(..., min_length=1)
    user_id: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)
    top_k: int = Field(default=4, ge=1, le=20)
    document_id: str | None = None
    leave_draft: dict[str, str] | None = None


class AgentQueryResponse(BaseModel):
    intent: str
    assistant_message: str
    rag: dict | None = None
    leave: dict | None = None


app = FastAPI(title="LegalMind Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup() -> None:
    await connect_to_mongo()


@app.on_event("shutdown")
async def shutdown() -> None:
    await close_mongo_connection()


@app.post("/agent/query", response_model=AgentQueryResponse)
async def agent_query(payload: AgentQueryRequest) -> dict:
    return await handle_agent_query(
        company_id=payload.company_id,
        user_id=payload.user_id,
        message=payload.message,
        top_k=payload.top_k,
        document_id=payload.document_id,
        leave_draft=payload.leave_draft,
    )


@app.post("/upload")
async def upload(file: UploadFile = File(...), company_id: str = Form(...)) -> dict:
    return await upload_pdf(file=file, company={"_id": company_id})


@app.get("/documents")
async def list_documents(company_id: str) -> dict:
    return await list_company_documents(company={"_id": company_id})


@app.get("/leave/requests")
async def get_leave_requests(company_id: str) -> dict:
    items = await list_leave_requests(company_id=company_id)
    return {"requests": items}
