from typing import Optional

from fastapi import Header, HTTPException

from app.db.mongodb import db


async def get_current_company(authorization: Optional[str] = Header(default=None)) -> dict:
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
