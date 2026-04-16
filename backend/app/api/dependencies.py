from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from bson import ObjectId

from app.core.config import settings
from app.db.mongodb import db


bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_company(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = credentials.credentials.strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    session = await db.database["sessions"].find_one({"token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session token")

    company = await db.database["companies"].find_one({"_id": session["company_id"]})
    if not company:
        raise HTTPException(status_code=401, detail="Company account not found")

    return company


async def _resolve_internal_company() -> dict:
    if db.database is None:
        raise HTTPException(status_code=500, detail="Database connection is not ready")

    company = None
    if settings.internal_default_company_id:
        try:
            company = await db.database["companies"].find_one({"_id": ObjectId(settings.internal_default_company_id)})
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Invalid INTERNAL_DEFAULT_COMPANY_ID: {exc}") from exc
        if not company:
            raise HTTPException(status_code=500, detail="INTERNAL_DEFAULT_COMPANY_ID not found in companies collection")
        return company

    company = await db.database["companies"].find_one(sort=[("_id", 1)])
    if not company:
        raise HTTPException(status_code=500, detail="No company found for internal chat mode")
    return company


async def get_chat_company(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    if credentials and credentials.scheme.lower() == "bearer":
        token = credentials.credentials.strip()
        if token:
            session = await db.database["sessions"].find_one({"token": token})
            if session:
                company = await db.database["companies"].find_one({"_id": session["company_id"]})
                if company:
                    return company

    if settings.internal_chat_no_auth:
        return await _resolve_internal_company()

    raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
