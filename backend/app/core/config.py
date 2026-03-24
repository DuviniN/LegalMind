import os
from dotenv import load_dotenv

# load .env file
load_dotenv()

class Settings:
    mongodb_uri: str = os.getenv("MONGODB_URI")
    mongodb_db_name: str = os.getenv("MONGODB_DB_NAME")

settings = Settings()