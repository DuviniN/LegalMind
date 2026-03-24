from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings   # adjust path if needed


class MongoDB:
    client: AsyncIOMotorClient | None = None
    database: AsyncIOMotorDatabase | None = None


db = MongoDB()


# connect function
async def connect_to_mongo():
    db.client = AsyncIOMotorClient(settings.mongodb_uri)
    db.database = db.client[settings.mongodb_db_name]
    print("✅ Connected to MongoDB")


# disconnect function (optional but good practice)
async def close_mongo_connection():
    if db.client:
        db.client.close()
        print("❌ MongoDB connection closed")