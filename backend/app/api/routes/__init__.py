from app.api.routes.auth import router as auth_router
from app.api.routes.documents import router as documents_router
from app.api.routes.health import router as health_router
from app.api.routes.leave import router as leave_router
from app.api.routes.rag import router as rag_router

__all__ = ["auth_router", "documents_router", "health_router", "leave_router", "rag_router"]
