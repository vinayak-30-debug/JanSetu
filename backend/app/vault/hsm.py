"""Simulated Hardware Security Module (HSM) for Aadhaar Data Vault.

Complies with UIDAI Aadhaar Data Vault specifications:
- FIPS 140-2 Level 3 simulated tamper-resistant enclave.
- Master Key / Key Encryption Key (KEK) management.
- Dynamic Data Encryption Key (DEK) generation, versioning, and rotation.
- Cryptographic isolation from main application code.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import os
import threading
import time
from typing import Any, Dict, Optional, Tuple


class SimulatedHSM:
    """Simulates a dedicated Hardware Security Module (HSM) appliance.
    
    In production deployments, this interfaces via PKCS#11 with physical HSMs
    (e.g., Thales payShield, Luna HSM, AWS CloudHSM).
    Here, it simulates key custody, hardware-isolated cryptographic operations,
    and automated key rotation.
    """

    def __init__(self, master_seed: Optional[str] = None) -> None:
        self._lock = threading.Lock()
        # 256-bit Master Key / Key Encryption Key (KEK)
        seed_bytes = (master_seed or os.environ.get("HSM_MASTER_SEED") or "JANSETU-SIMULATED-HSM-ROOT-KEY-2026").encode("utf-8")
        self._kek: bytes = hashlib.sha256(seed_bytes).digest()

        # DEK storage: version -> encrypted_dek_bytes
        self._keys: Dict[str, bytes] = {}
        self._active_version: str = "DEK-v1.0"
        self._rotation_count: int = 0
        self._created_at: float = time.time()
        self._last_rotated_at: float = time.time()

        # Initialize primary DEK
        self._initialize_dek("DEK-v1.0")

    def _initialize_dek(self, version: str) -> None:
        """Generate a random 256-bit DEK and seal it with the KEK."""
        raw_dek = os.urandom(32)  # 256 bits
        # Seal DEK using KEK via HMAC-SHA256 derived envelope
        sealed = self._seal_key(raw_dek)
        self._keys[version] = sealed
        self._active_version = version

    def _seal_key(self, raw_key: bytes) -> bytes:
        """Envelope encryption: seal DEK with KEK."""
        salt = os.urandom(16)
        envelope_key = hashlib.pbkdf2_hmac("sha256", self._kek, salt, 100_000)
        # XOR seal with envelope key for pure in-memory HSM isolation
        masked = bytes(b ^ k for b, k in zip(raw_key, envelope_key[: len(raw_key)]))
        return salt + masked

    def _unseal_key(self, sealed_key: bytes) -> bytes:
        """Unseal DEK inside HSM enclave boundary."""
        salt = sealed_key[:16]
        masked = sealed_key[16:]
        envelope_key = hashlib.pbkdf2_hmac("sha256", self._kek, salt, 100_000)
        raw_key = bytes(b ^ k for b, k in zip(masked, envelope_key[: len(masked)]))
        return raw_key

    def get_active_dek(self) -> Tuple[str, bytes]:
        """Return (version, raw_dek) inside secure enclave boundary."""
        with self._lock:
            sealed = self._keys[self._active_version]
            return self._active_version, self._unseal_key(sealed)

    def get_dek_by_version(self, version: str) -> bytes:
        """Return raw DEK for a historical version to support transparent re-encryption."""
        with self._lock:
            if version not in self._keys:
                raise KeyError(f"HSM key version {version} not found in key vault")
            return self._unseal_key(self._keys[version])

    def rotate_key(self) -> Dict[str, Any]:
        """Rotate the active Data Encryption Key to a new version."""
        with self._lock:
            self._rotation_count += 1
            new_version = f"DEK-v{self._rotation_count + 1}.0"
            self._initialize_dek(new_version)
            self._last_rotated_at = time.time()
            return {
                "status": "KEY_ROTATED",
                "previous_version": f"DEK-v{self._rotation_count}.0",
                "active_version": new_version,
                "rotation_count": self._rotation_count,
                "timestamp": time.time(),
            }

    def sign_audit_entry(self, data: str) -> str:
        """Generate an HSM-backed HMAC-SHA256 signature for tamper-evident audit logs."""
        return hmac.new(self._kek, data.encode("utf-8"), hashlib.sha256).hexdigest()

    def get_status(self) -> Dict[str, Any]:
        """Return public telemetry regarding HSM health and key metadata."""
        with self._lock:
            return {
                "hsm_model": "Simulated FIPS 140-2 Level 3 Enclave",
                "hsm_status": "ONLINE",
                "active_key_version": self._active_version,
                "total_key_versions": len(self._keys),
                "rotation_count": self._rotation_count,
                "kek_fingerprint": hashlib.sha256(self._kek).hexdigest()[:16] + "...",
                "last_rotated_at": self._last_rotated_at,
                "uptime_seconds": round(time.time() - self._created_at, 2),
            }


# Singleton HSM instance for JanSetu Aadhaar Data Vault
hsm = SimulatedHSM()
