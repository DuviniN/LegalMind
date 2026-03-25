from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.core.config import settings
from app.db.mongodb import db
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
import hashlib
import secrets

load_dotenv()
app = FastAPI()

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown():
    await close_mongo_connection()


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


async def get_current_company(authorization: Optional[str] = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = authorization.split(" ", 1)[1].strip()
    session = await db.database["sessions"].find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session token")

    company = await db.database["companies"].find_one({"_id": session["company_id"]})
    if not company:
        raise HTTPException(status_code=401, detail="Company account not found")

    return company


class RegisterRequest(BaseModel):
    company_name: str
    email: EmailStr
    password: str
    secret_key: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@app.post("/register")
async def register_company(payload: RegisterRequest):
    configured_secret = settings.company_owner_secret_key.strip()
    if not configured_secret:
        raise HTTPException(status_code=500, detail="Company secret key is not configured")

    if payload.secret_key.strip() != configured_secret:
        raise HTTPException(status_code=403, detail="Invalid secret key")

    existing = await db.database["companies"].find_one({"email": payload.email.lower().strip()})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    now = datetime.now(timezone.utc)
    result = await db.database["companies"].insert_one(
        {
            "company_name": payload.company_name.strip(),
            "email": payload.email.lower().strip(),
            "password_hash": hash_password(payload.password),
            "created_at": now,
        }
    )

    return {
        "message": "Registration successful",
        "company_id": str(result.inserted_id),
        "created_at": now.isoformat(),
    }


@app.post("/login")
async def login_company(payload: LoginRequest):
    company = await db.database["companies"].find_one({"email": payload.email.lower().strip()})
    if not company or company.get("password_hash") != hash_password(payload.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = secrets.token_urlsafe(32)
    await db.database["sessions"].insert_one(
        {
            "company_id": company["_id"],
            "token": token,
            "created_at": datetime.now(timezone.utc),
        }
    )

    return {
        "token": token,
        "company": {
            "id": str(company["_id"]),
            "company_name": company.get("company_name", ""),
            "email": company.get("email", ""),
        },
    }


@app.post("/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    company=Depends(get_current_company),
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    timestamp = datetime.now(timezone.utc)
    safe_name = f"{int(timestamp.timestamp())}_{Path(file.filename).name}"
    company_dir = UPLOAD_DIR / str(company["_id"])
    company_dir.mkdir(parents=True, exist_ok=True)
    save_path = company_dir / safe_name

    content = await file.read()
    with open(save_path, "wb") as out_file:
        out_file.write(content)

    doc = {
        "company_id": company["_id"],
        "file_name": file.filename,
        "stored_name": safe_name,
        "path": str(save_path),
        "uploaded_at": timestamp,
    }
    result = await db.database["documents"].insert_one(doc)

    return {
        "message": "File uploaded successfully",
        "document_id": str(result.inserted_id),
        "file_name": file.filename,
        "uploaded_at": timestamp.isoformat(),
    }


@app.get("/documents")
async def list_documents(company=Depends(get_current_company)):
    cursor = db.database["documents"].find({"company_id": company["_id"]}).sort("uploaded_at", -1)
    documents = []
    async for item in cursor:
        uploaded_at = item.get("uploaded_at")
        documents.append(
            {
                "id": str(item.get("_id")),
                "file_name": item.get("file_name", ""),
                "path": item.get("path", ""),
                "uploaded_at": uploaded_at.isoformat() if uploaded_at else None,
            }
        )

    return {"documents": documents}

@app.get("/")
def home():
    return {"message": "LegalMind Backend Running!"}


@app.get("/health/db")
async def health_db():
    if not db.client:
        return {"status": "error", "message": "MongoDB client not initialized"}
    await db.client.admin.command("ping")
    return {"status": "ok", "database": settings.mongodb_db_name}