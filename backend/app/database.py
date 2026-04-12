from motor.motor_asyncio import AsyncIOMotorClient
from .config import get_settings

settings = get_settings()

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

async def connect_to_mongo():
    if not settings.USE_MONGO:
        db_instance.client = None
        db_instance.db = None
        return

    try:
        client = AsyncIOMotorClient(
            settings.MONGO_URI,
            serverSelectionTimeoutMS=1000,
            connectTimeoutMS=1000,
            socketTimeoutMS=2000,
        )
        await client.admin.command("ping")
        db_instance.client = client
        db_instance.db = client[settings.DB_NAME]
        print(f"Connected to MongoDB: {settings.DB_NAME}")
    except Exception as e:
        db_instance.client = None
        db_instance.db = None
        print(f"MongoDB unavailable, using local fallback data only: {e}")

async def close_mongo_connection():
    if db_instance.client is not None:
        db_instance.client.close()
        print("Closed MongoDB connection")

def get_database():
    return db_instance.db
