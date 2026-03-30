import logging
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

logger = logging.getLogger("zolexora.db")
_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None

def get_db() -> AsyncIOMotorDatabase:
    global _client, _db
    if _db is None:
        from core.config import settings
        _client = AsyncIOMotorClient(settings.MONGO_URL, serverSelectionTimeoutMS=5000)
        _db = _client[settings.DB_NAME]
        logger.info("MongoDB connected → %s", settings.DB_NAME)
    return _db

def close_db() -> None:
    global _client, _db
    if _client:
        _client.close()
        logger.info("MongoDB disconnected")
    _client = None
    _db = None
