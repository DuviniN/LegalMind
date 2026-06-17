from pydantic import BaseModel, Field


class PublicVacancyItem(BaseModel):
    id: str
    title: str
    department: str
    location: str
    employment_type: str
    description: str
    status: str
    created_at: str | None = None


class VacancyItem(PublicVacancyItem):
    company_id: str
    requirements: str
    poster_filename: str | None = None
    updated_at: str | None = None


class PublicVacancyListResponse(BaseModel):
    vacancies: list[PublicVacancyItem] = Field(default_factory=list)


class VacancyListResponse(BaseModel):
    vacancies: list[VacancyItem] = Field(default_factory=list)


class VacancyCreateResponse(BaseModel):
    vacancy: VacancyItem


class VacancyStatusUpdateResponse(BaseModel):
    vacancy: VacancyItem


class CVApplicationItem(BaseModel):
    id: str
    vacancy_id: str
    candidate_name: str
    candidate_email: str
    candidate_phone: str | None = None
    cv_file_name: str
    match_score: int | None = None
    match_summary: str | None = None
    ranked_at: str | None = None
    applied_at: str | None = None


class CVApplicationSubmitResponse(BaseModel):
    application: CVApplicationItem


class CVApplicationListResponse(BaseModel):
    applications: list[CVApplicationItem] = Field(default_factory=list)


class RankResponse(BaseModel):
    applications: list[CVApplicationItem] = Field(default_factory=list)
