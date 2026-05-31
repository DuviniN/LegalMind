from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from simple_agent.core.config import settings


class MongoDB:
    client: AsyncIOMotorClient | None = None
    database: AsyncIOMotorDatabase | None = None


db = MongoDB()


async def connect_to_mongo() -> None:
    if db.client and db.database:
        return

    if not settings.mongodb_uri:
        raise RuntimeError("MONGODB_URI is not configured")
    if not settings.mongodb_db_name:
        raise RuntimeError("MONGODB_DB_NAME is not configured")

    db.client = AsyncIOMotorClient(settings.mongodb_uri, serverSelectionTimeoutMS=5000)
    await db.client.admin.command("ping")
    db.database = db.client[settings.mongodb_db_name]


async def close_mongo_connection() -> None:
    if db.client:
        db.client.close()
