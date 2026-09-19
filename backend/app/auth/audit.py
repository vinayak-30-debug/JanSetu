"""PII-safe audit events: raw identifiers and payloads are never recorded."""
import logging
from datetime import datetime, timezone

from ..database import get_database
from .security import fingerprint

logger = logging.getLogger(__name__)


async def record_audit_event(event: str, aadhaar: str, outcome: str) -> None:
    entry = {"event": event, "subject_hash": fingerprint(aadhaar), "outcome": outcome,
             "created_at": datetime.now(timezone.utc)}
    db = get_database()
    if db is not None:
        try:
            await db.audit_events.insert_one(entry)
            return
        except Exception:
            logger.warning("Could not persist audit event: %s", event)
    logger.info("audit event=%s outcome=%s subject_hash=%s", event, outcome, entry["subject_hash"][:12])
