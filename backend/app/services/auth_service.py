from datetime import datetime, timezone

from fastapi import HTTPException

from app.core.config import settings
from app.core.security import generate_session_token, hash_password
from app.db.mongodb import db


async def register_company(company_name: str, email: str, password: str, secret_key: str) -> dict:
    configured_secret = settings.company_owner_secret_key.strip()
    if not configured_secret:
        raise HTTPException(status_code=500, detail="Company secret key is not configured")

    if secret_key.strip() != configured_secret:
        raise HTTPException(status_code=403, detail="Invalid secret key")

    normalized_email = email.lower().strip()
    existing = await db.database["companies"].find_one({"email": normalized_email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    now = datetime.now(timezone.utc)
    result = await db.database["companies"].insert_one(
        {
            "company_name": company_name.strip(),
            "email": normalized_email,
            "password_hash": hash_password(password),
            "created_at": now,
        }
    )

    return {
        "message": "Registration successful",
        "company_id": str(result.inserted_id),
        "created_at": now.isoformat(),
    }


async def login_company(email: str, password: str) -> dict:
    normalized_email = email.lower().strip()
    company = await db.database["companies"].find_one({"email": normalized_email})
    if not company or company.get("password_hash") != hash_password(password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = generate_session_token()
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
