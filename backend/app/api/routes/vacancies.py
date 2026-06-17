from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.api.dependencies import get_chat_company, get_current_company
from app.schemas.vacancy import (
    CVApplicationListResponse,
    CVApplicationSubmitResponse,
    PublicVacancyListResponse,
    RankResponse,
    VacancyCreateResponse,
    VacancyListResponse,
    VacancyStatusUpdateResponse,
)
from app.services.vacancy_service import (
    create_vacancy,
    get_vacancy,
    list_applications,
    list_company_vacancies,
    list_open_vacancies,
    rank_applications,
    submit_cv_application,
    update_vacancy_status,
)

router = APIRouter(tags=["vacancies"])


# ---- Public / candidate-facing ----
@router.get("/vacancies/open", response_model=PublicVacancyListResponse)
async def list_open(company: dict = Depends(get_chat_company)):
    return await list_open_vacancies(company=company)


@router.get("/vacancies/open/{vacancy_id}")
async def get_open_vacancy(vacancy_id: str, company: dict = Depends(get_chat_company)):
    return await get_vacancy(vacancy_id=vacancy_id)


@router.post("/vacancies/{vacancy_id}/apply", response_model=CVApplicationSubmitResponse)
async def apply_to_vacancy(
    vacancy_id: str,
    candidate_name: str = Form(...),
    candidate_email: str = Form(...),
    candidate_phone: str = Form(""),
    file: UploadFile = File(...),
    company: dict = Depends(get_chat_company),
):
    return await submit_cv_application(
        vacancy_id=vacancy_id,
        fields={
            "candidate_name": candidate_name,
            "candidate_email": candidate_email,
            "candidate_phone": candidate_phone,
        },
        cv_file=file,
    )


# ---- Manager-only ----
@router.post("/vacancies", response_model=VacancyCreateResponse)
async def create_vacancy_route(
    title: str = Form(...),
    department: str = Form(...),
    location: str = Form(...),
    employment_type: str = Form(...),
    description: str = Form(...),
    requirements: str = Form(...),
    poster: UploadFile | None = File(None),
    company: dict = Depends(get_current_company),
):
    return await create_vacancy(
        company=company,
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


@router.get("/vacancies", response_model=VacancyListResponse)
async def list_my_vacancies(company: dict = Depends(get_current_company)):
    return await list_company_vacancies(company=company)


@router.patch("/vacancies/{vacancy_id}/status", response_model=VacancyStatusUpdateResponse)
async def update_status(vacancy_id: str, status: str = Form(...), company: dict = Depends(get_current_company)):
    return await update_vacancy_status(vacancy_id=vacancy_id, status=status)


@router.get("/vacancies/{vacancy_id}/applications", response_model=CVApplicationListResponse)
async def get_applications(vacancy_id: str, company: dict = Depends(get_current_company)):
    return await list_applications(vacancy_id=vacancy_id)


@router.post("/vacancies/{vacancy_id}/rank", response_model=RankResponse)
async def rank_vacancy(vacancy_id: str, company: dict = Depends(get_current_company)):
    return await rank_applications(vacancy_id=vacancy_id)
