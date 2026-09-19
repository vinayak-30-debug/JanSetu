"""Fernet (AES) encryption for citizen records persisted in MongoDB."""
import json
from typing import Any

from cryptography.fernet import Fernet, InvalidToken
from ..config import get_settings


def _fernet() -> Fernet:
    key = get_settings().PII_ENCRYPTION_KEY
    if not key:
        raise RuntimeError("PII_ENCRYPTION_KEY is required before storing encrypted citizen records")
    return Fernet(key.encode())


def encrypt_record(record: dict[str, Any]) -> str:
    return _fernet().encrypt(json.dumps(record, separators=(",", ":")).encode()).decode()


def decrypt_record(ciphertext: str) -> dict[str, Any]:
    try:
        return json.loads(_fernet().decrypt(ciphertext.encode()).decode())
    except (InvalidToken, ValueError, TypeError, json.JSONDecodeError) as exc:
        raise ValueError("Encrypted citizen record cannot be decrypted") from exc
