from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.core.config import settings
from app.db.mongodb import db
from motor.motor_asyncio import AsyncIOMotorClient
from app.db.mongodb import connect_to_mongo, close_mongo_connection

load_dotenv()
app = FastAPI()

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

@app.get("/")
def home():
    return {"message": "LegalMind Backend Running!"}


@app.get("/health/db")
async def health_db():
    if not db.client:
        return {"status": "error", "message": "MongoDB client not initialized"}
    await db.client.admin.command("ping")
    return {"status": "ok", "database": settings.mongodb_db_name}