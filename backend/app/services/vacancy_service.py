from fastapi import UploadFile

from app.services.agent_client import (
    agent_get,
    agent_patch_form,
    agent_post_json,
    agent_post_multipart,
)


async def create_vacancy(company: dict, fields: dict, poster: UploadFile | None) -> dict:
    data = {"company_id": str(company["_id"]), **fields}
    files = {}
    if poster is not None and poster.filename:
        content = await poster.read()
        files["poster"] = (poster.filename, content, poster.content_type or "application/octet-stream")
    vacancy = await agent_post_multipart("/vacancies", data=data, files=files)
    return {"vacancy": vacancy}


async def list_company_vacancies(company: dict, status: str | None = None) -> dict:
    params = {"company_id": str(company["_id"])}
    if status:
        params["status"] = status
    return await agent_get("/vacancies", params=params)


async def list_open_vacancies(company: dict) -> dict:
    return await list_company_vacancies(company, status="open")


async def get_vacancy(vacancy_id: str) -> dict:
    vacancy = await agent_get(f"/vacancies/{vacancy_id}", params={})
    return {"vacancy": vacancy}


async def update_vacancy_status(vacancy_id: str, status: str) -> dict:
    vacancy = await agent_patch_form(f"/vacancies/{vacancy_id}/status", data={"status": status})
    return {"vacancy": vacancy}


async def submit_cv_application(vacancy_id: str, fields: dict, cv_file: UploadFile) -> dict:
    content = await cv_file.read()
    files = {"file": (cv_file.filename or "cv.pdf", content, cv_file.content_type or "application/pdf")}
    application = await agent_post_multipart(f"/vacancies/{vacancy_id}/applications", data=fields, files=files)
    return {"application": application}


async def list_applications(vacancy_id: str) -> dict:
    return await agent_get(f"/vacancies/{vacancy_id}/applications", params={})


async def rank_applications(vacancy_id: str) -> dict:
    return await agent_post_json(f"/vacancies/{vacancy_id}/rank", payload={})
