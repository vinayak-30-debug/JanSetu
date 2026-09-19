import re

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from .database import connect_to_mongo, close_mongo_connection
from .config import get_settings

from .api.v1.endpoints import router as v1_router

settings = get_settings()

if not settings.DEBUG and (not settings.SECRET_KEY or not settings.PII_ENCRYPTION_KEY):
    raise RuntimeError("SECRET_KEY and PII_ENCRYPTION_KEY must be configured outside development")

# Matches 12 consecutive digits (raw Aadhaar) or 4-4-4 patterns with spaces/dashes.
_AADHAAR_URL_PATTERN = re.compile(r"(?:^|/)(\d{12})(?:/|$)|(?:^|/)\d{4}[\s-]\d{4}[\s-]\d{4}(?:/|$)")


class AadhaarInURLMiddleware(BaseHTTPMiddleware):
    """Reject any request whose URL path contains an Aadhaar-like pattern.

    Defence-in-depth: even if a developer accidentally adds a new endpoint
    that takes Aadhaar in the URL, this middleware will block it before routing.
    """

    async def dispatch(self, request, call_next):
        if _AADHAAR_URL_PATTERN.search(request.url.path):
            return JSONResponse(
                status_code=400,
                content={"detail": "Aadhaar numbers must not appear in URLs. Use POST body instead."},
            )
        return await call_next(request)

app = FastAPI(title=settings.APP_NAME)
app.include_router(v1_router, prefix="/api/v1")

app.add_middleware(AadhaarInURLMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy", "app": settings.APP_NAME}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
