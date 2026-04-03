from fastapi import APIRouter

from app.schemas.auth import LoginRequest, RegisterRequest
from app.services.auth_service import login_company, register_company

router = APIRouter(tags=["auth"])


@router.post("/register")
async def register(payload: RegisterRequest):
    return await register_company(
        company_name=payload.company_name,
        email=payload.email,
        password=payload.password,
        secret_key=payload.secret_key,
    )


@router.post("/login")
async def login(payload: LoginRequest):
    return await login_company(email=payload.email, password=payload.password)
