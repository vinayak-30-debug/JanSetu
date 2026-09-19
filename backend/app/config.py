from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache
from pathlib import Path

class Settings(BaseSettings):
    APP_NAME: str = "Bharat Benefits Navigator"
    DEBUG: bool = True
    FRONTEND_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    
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
    # Required outside local development. Use a long random value from a secret manager.
    SECRET_KEY: str = ""
    PII_ENCRYPTION_KEY: str = ""
    AUTH_SESSION_TTL_MINUTES: int = 15
    AUTH_RATE_LIMIT_PER_MINUTE: int = 5

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

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.FRONTEND_ORIGINS.split(",") if origin.strip()]

@lru_cache()
def get_settings():
    return Settings()
