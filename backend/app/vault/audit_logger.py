"""Tamper-evident, hash-chained audit logger for Aadhaar Data Vault operations.

Complies with UIDAI Aadhaar Data Vault guidelines:
- Every access/tokenization/detokenization/key-rotation event is recorded.
- Entries are cryptographically chained using SHA-256 (blockchain-style tamper evidence).
- HSM signs each entry.
"""

from __future__ import annotations

import hashlib
import json
import threading
import time
from typing import Any, Dict, List, Optional

from .hsm import hsm


class AuditEntry:
    def __init__(
        self,
        index: int,
        timestamp: float,
        event_type: str,
        token_ref: str,
        id_type: str,
        status: str,
        client_ip: str,
        details: Dict[str, Any],
        prev_hash: str,
    ) -> None:
        self.index = index
        self.timestamp = timestamp
        self.event_type = event_type
        self.token_ref = token_ref
        self.id_type = id_type
        self.status = status
        self.client_ip = client_ip
        self.details = details
        self.prev_hash = prev_hash
        self.entry_hash = self._compute_hash()
        self.hsm_signature = hsm.sign_audit_entry(self.entry_hash)

    def _compute_hash(self) -> str:
        payload = (
            f"{self.index}:{self.timestamp}:{self.event_type}:{self.token_ref}:"
            f"{self.id_type}:{self.status}:{self.client_ip}:"
            f"{json.dumps(self.details, sort_keys=True)}:{self.prev_hash}"
        )
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "index": self.index,
            "timestamp": self.timestamp,
            "iso_time": time.strftime("%Y-%m-%d %H:%M:%SZ", time.gmtime(self.timestamp)),
            "event_type": self.event_type,
            "token_ref": self.token_ref,
            "id_type": self.id_type,
            "status": self.status,
            "client_ip": self.client_ip,
            "details": self.details,
            "prev_hash": self.prev_hash,
            "entry_hash": self.entry_hash,
            "hsm_signature": self.hsm_signature[:16] + "...",
        }


class VaultAuditLogger:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._entries: List[AuditEntry] = []
        # Genesis block
        genesis = AuditEntry(
            index=0,
            timestamp=time.time(),
            event_type="GENESIS",
            token_ref="SYSTEM",
            id_type="SYSTEM",
            status="SUCCESS",
            client_ip="127.0.0.1",
            details={"description": "JanSetu Aadhaar Data Vault Audit Log initialized with HSM Enclave"},
            prev_hash="0" * 64,
        )
        self._entries.append(genesis)

    def log(
        self,
        event_type: str,
        token_ref: str,
        id_type: str = "aadhaar",
        status: str = "SUCCESS",
        client_ip: str = "127.0.0.1",
        details: Optional[Dict[str, Any]] = None,
    ) -> AuditEntry:
        with self._lock:
            prev = self._entries[-1]
            entry = AuditEntry(
                index=len(self._entries),
                timestamp=time.time(),
                event_type=event_type,
                token_ref=token_ref,
                id_type=id_type,
                status=status,
                client_ip=client_ip,
                details=details or {},
                prev_hash=prev.entry_hash,
            )
            self._entries.append(entry)
            # Retain up to 2000 in memory
            if len(self._entries) > 2000:
                self._entries = self._entries[-2000:]
            return entry

    def verify_chain_integrity(self) -> Tuple[bool, str]:
        """Verify that every entry in the chain matches its hash and previous link."""
        with self._lock:
            for i in range(1, len(self._entries)):
                prev = self._entries[i - 1]
                curr = self._entries[i]
                if curr.prev_hash != prev.entry_hash:
                    return False, f"Broken chain link at index {curr.index}"
                if curr.entry_hash != curr._compute_hash():
                    return False, f"Tampered entry hash at index {curr.index}"
            return True, f"Verified {len(self._entries)} audit log entries. Chain intact."

    def get_recent_entries(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self._lock:
            return [e.to_dict() for e in reversed(self._entries[-limit:])]

    @property
    def total_entries(self) -> int:
        with self._lock:
            return len(self._entries)


vault_audit_logger = VaultAuditLogger()
