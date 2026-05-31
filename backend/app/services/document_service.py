from fastapi import UploadFile

from app.services.agent_client import agent_get, agent_post_multipart


async def upload_pdf(file: UploadFile, company: dict) -> dict:
    content = await file.read()
    files = {
        "file": (
            file.filename or "upload.pdf",
            content,
            file.content_type or "application/pdf",
        )
    }
    data = {"company_id": str(company["_id"])}
    return await agent_post_multipart("/upload", data=data, files=files)


async def list_company_documents(company: dict) -> dict:
    return await agent_get("/documents", params={"company_id": str(company["_id"])})
