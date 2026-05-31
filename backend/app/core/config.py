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
    agent_server_url: str = os.getenv("AGENT_SERVER_URL", "http://127.0.0.1:8101")
    agent_server_timeout_sec: float = float(os.getenv("AGENT_SERVER_TIMEOUT_SEC", "30"))
    internal_chat_no_auth: bool = _as_bool(os.getenv("INTERNAL_CHAT_NO_AUTH"), default=False)
    internal_default_company_id: str = os.getenv("INTERNAL_DEFAULT_COMPANY_ID", "").strip()

settings = Settings()