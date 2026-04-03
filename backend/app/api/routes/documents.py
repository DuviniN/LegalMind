from fastapi import APIRouter, Depends, File, UploadFile

from app.api.dependencies import get_current_company
from app.schemas.document import DocumentListResponse
from app.services.document_service import list_company_documents, upload_pdf

router = APIRouter(tags=["documents"])


@router.post("/upload")
async def upload(file: UploadFile = File(...), company: dict = Depends(get_current_company)):
    return await upload_pdf(file=file, company=company)


@router.get("/documents", response_model=DocumentListResponse)
async def list_documents(company: dict = Depends(get_current_company)):
    return await list_company_documents(company=company)
