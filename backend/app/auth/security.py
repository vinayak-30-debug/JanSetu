"""Short-lived, Aadhaar-bound browser sessions with no raw PII in tokens."""
import base64
import hashlib
import hmac
import json
import time
from collections import defaultdict, deque
from threading import Lock
from typing import Any

from fastapi import HTTPException, Request

from ..config import get_settings

_attempts: dict[str, deque[float]] = defaultdict(deque)
_attempt_lock = Lock()


def _secret() -> bytes:
    value = get_settings().SECRET_KEY
    return (value or "jansetu-development-only-not-for-production").encode("utf-8")


def fingerprint(value: str) -> str:
    return hmac.new(_secret(), value.encode("utf-8"), hashlib.sha256).hexdigest()


def mask_aadhaar(value: str) -> str:
    digits = "".join(char for char in str(value) if char.isdigit())
    return f"XXXX-XXXX-{digits[-4:]}" if len(digits) >= 4 else "XXXX-XXXX-XXXX"


def enforce_rate_limit(request: Request, action: str) -> None:
    address = request.client.host if request.client else "unknown"
    key, now = f"{action}:{address}", time.monotonic()
    with _attempt_lock:
        bucket = _attempts[key]
        while bucket and now - bucket[0] >= 60:
            bucket.popleft()
        if len(bucket) >= get_settings().AUTH_RATE_LIMIT_PER_MINUTE:
            raise HTTPException(status_code=429, detail="Too many attempts. Try again shortly.")
        bucket.append(now)


def issue_aadhaar_session(phone: str, aadhaar: str) -> str:
    settings = get_settings()
    payload = {
        "v": 1, "phone_hash": fingerprint(phone), "aadhaar_hash": fingerprint(aadhaar),
        "purpose": "aadhaar_lookup", "consent": True,
        "exp": int(time.time()) + settings.AUTH_SESSION_TTL_MINUTES * 60,
    }
    body = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).rstrip(b"=")
    signature = hmac.new(_secret(), body, hashlib.sha256).digest()
    return f"{body.decode()}.{base64.urlsafe_b64encode(signature).rstrip(b'=').decode()}"


def require_aadhaar_session(request: Request, aadhaar: str) -> dict[str, Any]:
    token = request.cookies.get("jansetu_aadhaar_session", "")
    if not token:
        header = request.headers.get("Authorization", "")
        token = header.removeprefix("Bearer ").strip() if header.startswith("Bearer ") else ""
    try:
        body, provided_signature = token.split(".", 1)
        expected = hmac.new(_secret(), body.encode(), hashlib.sha256).digest()
        actual = base64.urlsafe_b64decode(provided_signature + "=" * (-len(provided_signature) % 4))
        payload = json.loads(base64.urlsafe_b64decode(body + "=" * (-len(body) % 4)))
        valid = hmac.compare_digest(expected, actual) and payload.get("purpose") == "aadhaar_lookup"
        valid = valid and payload.get("consent") and payload.get("exp", 0) >= time.time()
        valid = valid and hmac.compare_digest(payload.get("aadhaar_hash", ""), fingerprint(aadhaar))
        if not valid:
            raise ValueError("invalid session")
        return payload
    except (ValueError, TypeError, json.JSONDecodeError, UnicodeDecodeError):
        raise HTTPException(status_code=401, detail="A valid, unexpired Aadhaar verification session is required")
