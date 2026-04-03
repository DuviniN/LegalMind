from fastapi import APIRouter

from app.core.config import settings
from app.db.mongodb import db

router = APIRouter(tags=["health"])


@router.get("/")
def home():
    return {"message": "LegalMind Backend Running!"}


@router.get("/health/db")
async def health_db():
    if not db.client:
        return {"status": "error", "message": "MongoDB client not initialized"}

    await db.client.admin.command("ping")
    return {"status": "ok", "database": settings.mongodb_db_name}
