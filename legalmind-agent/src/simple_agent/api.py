from __future__ import annotations

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from simple_agent.db.mongodb import close_mongo_connection, connect_to_mongo
from simple_agent.graph import handle_agent_query
from simple_agent.services.document_service import list_company_documents, upload_pdf
from simple_agent.services.leave_service import list_leave_requests
from simple_agent.services.vacancy_service import (
    _get_raw_applications,
    create_vacancy,
    get_vacancy,
    list_applications,
    list_vacancies,
    submit_cv_application,
    update_vacancy_status,
)
from simple_agent.tools.cv_ranking_tool import cv_ranking_tool


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


@app.post("/vacancies")
async def create_vacancy_route(
    company_id: str = Form(...),
    title: str = Form(...),
    department: str = Form(...),
    location: str = Form(...),
    employment_type: str = Form(...),
    description: str = Form(...),
    requirements: str = Form(...),
    poster: UploadFile | None = File(None),
) -> dict:
    return await create_vacancy(
        company={"_id": company_id},
        fields={
            "title": title,
            "department": department,
            "location": location,
            "employment_type": employment_type,
            "description": description,
            "requirements": requirements,
        },
        poster=poster,
    )


@app.get("/vacancies")
async def list_vacancies_route(company_id: str, status: str | None = None) -> dict:
    return {"vacancies": await list_vacancies(company_id=company_id, status=status)}


@app.get("/vacancies/{vacancy_id}")
async def get_vacancy_route(vacancy_id: str) -> dict:
    return await get_vacancy(vacancy_id=vacancy_id)


@app.patch("/vacancies/{vacancy_id}/status")
async def update_vacancy_status_route(vacancy_id: str, status: str = Form(...)) -> dict:
    return await update_vacancy_status(vacancy_id=vacancy_id, status=status)


@app.post("/vacancies/{vacancy_id}/applications")
async def submit_cv_application_route(
    vacancy_id: str,
    candidate_name: str = Form(...),
    candidate_email: str = Form(...),
    candidate_phone: str = Form(""),
    file: UploadFile = File(...),
) -> dict:
    vacancy = await get_vacancy(vacancy_id=vacancy_id)
    return await submit_cv_application(
        vacancy=vacancy,
        fields={
            "candidate_name": candidate_name,
            "candidate_email": candidate_email,
            "candidate_phone": candidate_phone,
        },
        cv_file=file,
    )


@app.get("/vacancies/{vacancy_id}/applications")
async def list_applications_route(vacancy_id: str) -> dict:
    return {"applications": await list_applications(vacancy_id=vacancy_id)}


@app.post("/vacancies/{vacancy_id}/rank")
async def rank_vacancy_route(vacancy_id: str) -> dict:
    vacancy = await get_vacancy(vacancy_id=vacancy_id)
    raw_applications = await _get_raw_applications(vacancy_id=vacancy_id)
    ranked = await cv_ranking_tool.rank(vacancy=vacancy, applications=raw_applications)
    return {"applications": ranked}
