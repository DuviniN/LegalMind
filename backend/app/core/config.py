import os
from pathlib import Path
from dotenv import load_dotenv

# load .env file from backend root
ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)


def _as_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}

class Settings:
    mongodb_uri: str = os.getenv("MONGODB_URI")
    mongodb_db_name: str = os.getenv("MONGODB_DB_NAME")
    company_owner_secret_key: str = os.getenv("COMPANY_OWNER_SECRET_KEY", "")
    groq_api_key: str = os.getenv("GROQ_API_KEY")
    groq_model_name: str = os.getenv("GROQ_MODEL_NAME")
    rag_embedding_model: str = os.getenv("RAG_EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    rag_chunk_size: int = int(os.getenv("RAG_CHUNK_SIZE", "1000"))
    rag_chunk_overlap: int = int(os.getenv("RAG_CHUNK_OVERLAP", "150"))
    rag_top_k: int = int(os.getenv("RAG_TOP_K", "4"))
    chroma_persist_dir: str = os.getenv(
        "CHROMA_PERSIST_DIR",
        str((Path(__file__).resolve().parents[1] / "chroma_db").resolve()),
    )
    internal_chat_no_auth: bool = _as_bool(os.getenv("INTERNAL_CHAT_NO_AUTH"), default=False)
    internal_default_company_id: str = os.getenv("INTERNAL_DEFAULT_COMPANY_ID", "").strip()

settings = Settings()