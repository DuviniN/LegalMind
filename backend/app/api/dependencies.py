from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

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
