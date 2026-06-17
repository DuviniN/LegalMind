from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import agent_router, auth_router, documents_router, health_router, leave_router, vacancies_router
from app.db.mongodb import close_mongo_connection, connect_to_mongo

app = FastAPI(title="LegalMind Backend")

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

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(leave_router)
app.include_router(agent_router)
app.include_router(vacancies_router)
