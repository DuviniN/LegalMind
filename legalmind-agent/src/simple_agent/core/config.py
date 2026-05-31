import os
from pathlib import Path

from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)


class Settings:
    mongodb_uri: str = os.getenv("MONGODB_URI", "")
    mongodb_db_name: str = os.getenv("MONGODB_DB_NAME", "legalmind")
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    groq_model_name: str = os.getenv("GROQ_MODEL_NAME", "")
    rag_embedding_model: str = os.getenv("RAG_EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    rag_chunk_size: int = int(os.getenv("RAG_CHUNK_SIZE", "1000"))
    rag_chunk_overlap: int = int(os.getenv("RAG_CHUNK_OVERLAP", "150"))
    rag_top_k: int = int(os.getenv("RAG_TOP_K", "4"))
    chroma_persist_dir: str = os.getenv(
        "CHROMA_PERSIST_DIR",
        str((Path(__file__).resolve().parents[2] / "chroma_db").resolve()),
    )


settings = Settings()
