import json
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import numpy as np

# Config
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "bbn_db"
COLLECTION_NAME = "citizens"
JSON_PATH = r"c:\Users\palar\OneDrive\Documents\klhackthon\backend\data\citizens.json"

async def ingest_citizens():
    print(f"Connecting to MongoDB at {MONGO_URI}...")
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]

    if not os.path.exists(JSON_PATH):
        print(f"Error: {JSON_PATH} not found.")
        return

    print(f"Loading data from {JSON_PATH}...")
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Normalization
    print("Normalizing data (handling NaN, etc.)...")
    normalized_data = []
    for record in data:
        # Replace NaN with None
        clean_record = {k: (None if isinstance(v, float) and np.isnan(v) else v) for k, v in record.items()}
        
        # Ensure Aadhaar_No is treated as string for consistent lookup if it's large
        if "Aadhaar_No" in clean_record:
            clean_record["Aadhaar_No"] = str(clean_record["Aadhaar_No"])
            
        normalized_data.append(clean_record)

    print(f"Clearing existing collection: {COLLECTION_NAME}...")
    await collection.delete_many({})

    print(f"Inserting {len(normalized_data)} records...")
    if normalized_data:
        await collection.insert_many(normalized_data)

    print(f"Creating unique index on Aadhaar_No...")
    await collection.create_index("Aadhaar_No", unique=True)

    print("Ingestion complete!")
    client.close()

if __name__ == "__main__":
    asyncio.run(ingest_citizens())
