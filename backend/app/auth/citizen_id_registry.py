"""In-memory TTL registry: opaque citizen_id (UUID) → Aadhaar number.

The citizen_id is handed to the frontend after a successful POST /citizen/lookup
and used in all subsequent requests so that raw Aadhaar never appears in URLs,
query strings, or log-visible request paths.

Entries expire after ``TTL_SECONDS`` (default: 30 minutes, matching the session
TTL).  A background reap runs on every ``register`` / ``resolve`` call to keep
memory bounded.
"""

import threading
import time
import uuid
from typing import Optional

from ..config import get_settings

# Default TTL matches AUTH_SESSION_TTL_MINUTES from settings.
_DEFAULT_TTL_SECONDS: int = 30 * 60


class _CitizenIdRegistry:
    """Thread-safe, auto-evicting TTL map."""

    def __init__(self) -> None:
        self._store: dict[str, tuple[str, float]] = {}  # citizen_id → (aadhaar, expires_at)
        self._lock = threading.Lock()

    @property
    def _ttl(self) -> int:
        try:
            return get_settings().AUTH_SESSION_TTL_MINUTES * 60
        except Exception:
            return _DEFAULT_TTL_SECONDS

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def register(self, aadhaar: str) -> str:
        """Create a new citizen_id for *aadhaar* and return it."""
        self._reap()
        citizen_id = str(uuid.uuid4())
        with self._lock:
            self._store[citizen_id] = (aadhaar, time.monotonic() + self._ttl)
        return citizen_id

    def resolve(self, citizen_id: str) -> Optional[str]:
        """Return the Aadhaar mapped to *citizen_id*, or ``None`` if expired / missing."""
        self._reap()
        with self._lock:
            entry = self._store.get(citizen_id)
            if entry is None:
                return None
            aadhaar, expires_at = entry
            if time.monotonic() > expires_at:
                del self._store[citizen_id]
                return None
            return aadhaar

    # ------------------------------------------------------------------
    # Internal
    # ------------------------------------------------------------------

    def _reap(self) -> None:
        """Remove expired entries (best-effort, non-blocking)."""
        if not self._lock.acquire(blocking=False):
            return
        try:
            now = time.monotonic()
            expired = [cid for cid, (_, exp) in self._store.items() if now > exp]
            for cid in expired:
                del self._store[cid]
        finally:
            self._lock.release()


citizen_id_registry = _CitizenIdRegistry()
