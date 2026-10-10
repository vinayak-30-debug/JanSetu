"""Aadhaar Data Vault (ADV) isolated microservice module.

Complies with UIDAI Aadhaar Data Vault Regulations:
- Encrypts Aadhaar / Virtual ID (VID) using AES-256-GCM.
- Managed by Simulated HSM with Key Encryption Key (KEK) & Data Encryption Key (DEK).
- Assigns a unique, non-reversible Reference Key (UID Token) to every citizen ID.
- Isolated storage: Segregated from main business/citizen database.
- Audit-logged operations with tamper-evident cryptographic hash chains.
"""

from __future__ import annotations

import base64
import json
import os
import threading
import time
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from .audit_logger import vault_audit_logger
from .hsm import hsm


class AadhaarDataVault:
    """Isolated Aadhaar Data Vault instance."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        # In-memory vault registry: uid_token -> EncryptedVaultRecord
        # And fast reverse lookup: id_hash -> uid_token (to maintain deterministic reference key)
        self._vault_store: Dict[str, Dict[str, Any]] = {}
        self._hash_to_token: Dict[str, str] = {}
        self._storage_path = Path(__file__).resolve().parent / "vault_storage.json"
        self._load_persisted_vault()

    def _load_persisted_vault(self) -> None:
        """Load encrypted records from persistent vault store if present."""
        if not self._storage_path.exists():
            return
        try:
            with open(self._storage_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self._vault_store = data.get("records", {})
                self._hash_to_token = data.get("hash_index", {})
        except Exception:
            pass

    def _persist_vault(self) -> None:
        """Persist encrypted records to isolated vault disk (best effort)."""
        try:
            with open(self._storage_path, "w", encoding="utf-8") as f:
                json.dump(
                    {"records": self._vault_store, "hash_index": self._hash_to_token},
                    f,
                    indent=2,
                )
        except Exception:
            pass

    def store_identity(
        self,
        raw_id: str,
        id_type: str,
        uid_token: str,
        client_ip: str = "127.0.0.1",
    ) -> Dict[str, Any]:
        """Encrypt and store Aadhaar/VID inside the vault enclave.
        
        Returns vault metadata (excluding raw Aadhaar).
        """
        raw_id_clean = "".join(c for c in str(raw_id) if c.isdigit())
        with self._lock:
            # Check if already vaulted
            id_hash = hsm.sign_audit_entry(f"{id_type}:{raw_id_clean}")
            existing_token = self._hash_to_token.get(id_hash)
            if existing_token and existing_token in self._vault_store:
                record = self._vault_store[existing_token]
                vault_audit_logger.log(
                    event_type="LOOKUP",
                    token_ref=existing_token,
                    id_type=id_type,
                    status="SUCCESS",
                    client_ip=client_ip,
                    details={"action": "reused_existing_vault_token", "key_version": record.get("key_version")},
                )
                return {
                    "uid_token": existing_token,
                    "masked_id": record["masked_id"],
                    "key_version": record["key_version"],
                    "is_new": False,
                }

            # Encrypt using active HSM DEK via AES-256-GCM
            active_version, raw_dek = hsm.get_active_dek()
            aesgcm = AESGCM(raw_dek)
            nonce = os.urandom(12)  # 96-bit nonce for GCM

            payload = {
                "raw_id": raw_id_clean,
                "id_type": id_type,
                "created_at": time.time(),
            }
            ciphertext = aesgcm.encrypt(nonce, json.dumps(payload).encode("utf-8"), None)

            # Determine masked display
            last_four = raw_id_clean[-4:] if len(raw_id_clean) >= 4 else "XXXX"
            if id_type == "vid":
                masked_id = f"XXXX-XXXX-XXXX-{last_four}"
            else:
                masked_id = f"XXXX-XXXX-{last_four}"

            record = {
                "uid_token": uid_token,
                "key_version": active_version,
                "nonce_b64": base64.b64encode(nonce).decode("utf-8"),
                "ciphertext_b64": base64.b64encode(ciphertext).decode("utf-8"),
                "masked_id": masked_id,
                "id_type": id_type,
                "created_at": time.time(),
            }

            self._vault_store[uid_token] = record
            self._hash_to_token[id_hash] = uid_token
            self._persist_vault()

            vault_audit_logger.log(
                event_type="TOKENIZE",
                token_ref=uid_token,
                id_type=id_type,
                status="SUCCESS",
                client_ip=client_ip,
                details={
                    "cipher": "AES-256-GCM",
                    "key_version": active_version,
                    "masked_id": masked_id,
                },
            )

            return {
                "uid_token": uid_token,
                "masked_id": masked_id,
                "key_version": active_version,
                "is_new": True,
            }

    def detokenize_emergency(
        self,
        uid_token: str,
        reason: str,
        client_ip: str = "127.0.0.1",
    ) -> Optional[str]:
        """Emergency / UIDAI e-KYC detokenization.
        
        Strictly restricted: requires documented reason and logs high-priority audit event.
        """
        with self._lock:
            record = self._vault_store.get(uid_token)
            if not record:
                vault_audit_logger.log(
                    event_type="DETOKENIZE_FAIL",
                    token_ref=uid_token,
                    status="NOT_FOUND",
                    client_ip=client_ip,
                    details={"reason": reason},
                )
                return None

            try:
                raw_dek = hsm.get_dek_by_version(record["key_version"])
                aesgcm = AESGCM(raw_dek)
                nonce = base64.b64decode(record["nonce_b64"])
                ciphertext = base64.b64decode(record["ciphertext_b64"])
                plaintext = aesgcm.decrypt(nonce, ciphertext, None)
                data = json.loads(plaintext.decode("utf-8"))

                vault_audit_logger.log(
                    event_type="DETOKENIZE_AUTHORIZED",
                    token_ref=uid_token,
                    id_type=record["id_type"],
                    status="SUCCESS",
                    client_ip=client_ip,
                    details={"reason": reason, "key_version": record["key_version"]},
                )
                return data.get("raw_id")
            except Exception as e:
                vault_audit_logger.log(
                    event_type="DETOKENIZE_ERROR",
                    token_ref=uid_token,
                    status="ERROR",
                    client_ip=client_ip,
                    details={"error": str(e)},
                )
                return None

    def reencrypt_vault_with_new_key(self, client_ip: str = "127.0.0.1") -> Dict[str, Any]:
        """Triggered upon HSM key rotation: re-encrypts all stored vault items with the active DEK."""
        with self._lock:
            active_version, active_dek = hsm.get_active_dek()
            active_aesgcm = AESGCM(active_dek)
            reencrypted_count = 0

            for token, record in list(self._vault_store.items()):
                old_version = record.get("key_version")
                if old_version == active_version:
                    continue

                try:
                    old_dek = hsm.get_dek_by_version(old_version)
                    old_aesgcm = AESGCM(old_dek)
                    old_nonce = base64.b64decode(record["nonce_b64"])
                    old_cipher = base64.b64decode(record["ciphertext_b64"])
                    plaintext = old_aesgcm.decrypt(old_nonce, old_cipher, None)

                    # Re-encrypt with new active DEK
                    new_nonce = os.urandom(12)
                    new_cipher = active_aesgcm.encrypt(new_nonce, plaintext, None)

                    record["key_version"] = active_version
                    record["nonce_b64"] = base64.b64encode(new_nonce).decode("utf-8")
                    record["ciphertext_b64"] = base64.b64encode(new_cipher).decode("utf-8")
                    reencrypted_count += 1
                except Exception:
                    pass

            self._persist_vault()

            vault_audit_logger.log(
                event_type="KEY_ROTATION_REENCRYPT",
                token_ref="ALL_VAULT_RECORDS",
                id_type="SYSTEM",
                status="SUCCESS",
                client_ip=client_ip,
                details={
                    "new_key_version": active_version,
                    "reencrypted_records": reencrypted_count,
                    "total_records": len(self._vault_store),
                },
            )

            return {
                "active_key_version": active_version,
                "reencrypted_records": reencrypted_count,
                "total_vault_records": len(self._vault_store),
            }

    def get_token_by_id_hash(self, id_hash: str) -> Optional[str]:
        with self._lock:
            return self._hash_to_token.get(id_hash)

    def get_vault_stats(self) -> Dict[str, Any]:
        with self._lock:
            return {
                "total_vault_records": len(self._vault_store),
                "active_key_version": hsm.get_active_dek()[0],
                "storage_backend": "Isolated Vault Enclave (AES-256-GCM)",
                "disk_sync": str(self._storage_path.name),
            }


aadhaar_data_vault = AadhaarDataVault()
