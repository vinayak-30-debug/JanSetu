from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache
from pathlib import Path

class Settings(BaseSettings):
    APP_NAME: str = "Bharat Benefits Navigator"
    DEBUG: bool = True
    
    # Database
    USE_MONGO: bool = True
    MONGO_URI: str = "mongodb://localhost:27017"
    DB_NAME: str = "bbn_db"
    
    # LLM
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    LLM_MODE: str = "auto"  # auto | online | offline
    
    # Auth
    FIREBASE_CREDENTIALS_PATH: str = "./firebase_credentials.json"
    SECRET_KEY: str = "supersecret"

    # OTP / Twilio
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_VERIFY_SERVICE_SID: str = ""

    @field_validator("DEBUG", mode="before")
    @classmethod
    def normalize_debug_value(cls, value):
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"release", "prod", "production"}:
                return False
            if normalized in {"debug", "dev", "development"}:
                return True
        return value
    
    class Config:
        env_file = str(Path(__file__).resolve().parents[1] / ".env")

@lru_cache()
def get_settings():
    return Settings()
