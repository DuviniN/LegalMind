import os
from pathlib import Path
from dotenv import load_dotenv

# load .env file from backend root
ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=ENV_PATH, override=True)

class Settings:
    mongodb_uri: str = os.getenv("MONGODB_URI")
    mongodb_db_name: str = os.getenv("MONGODB_DB_NAME")
    company_owner_secret_key: str = os.getenv("COMPANY_OWNER_SECRET_KEY", "")

settings = Settings()