from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    company_name: str
    email: EmailStr
    password: str
    secret_key: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
