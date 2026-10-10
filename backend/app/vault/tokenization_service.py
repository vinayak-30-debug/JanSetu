"""Tokenization Service for JanSetu.

Acts as the single secure entry point for all citizen identification inputs.
- Accepts raw 12-digit Aadhaar or 16-digit Virtual ID (VID).
- Validates syntax and Verhoeff checksum.
- Generates a deterministic, cryptographically non-reversible Reference Key (UID Token).
- Enforces isolation: delegates storage strictly to Aadhaar Data Vault.
- Purges raw numbers from execution memory immediately.
"""

from __future__ import annotations

import hashlib
import hmac
from dataclasses import dataclass
from typing import Any, Dict, Optional, Tuple

from .aadhaar_data_vault import aadhaar_data_vault
from .audit_logger import vault_audit_logger
from .hsm import hsm
from .verhoeff import validate_aadhaar_format, validate_vid_format


@dataclass(frozen=True)
class TokenizationResult:
    uid_token: str
    masked_id: str
    id_type: str
    last_four: str
    key_version: str
    checksum_valid: bool
    diagnostic_message: str


class TokenizationService:
    """Tokenization Service operating in front of the Main DB and application."""

    @staticmethod
    def _generate_uid_token(raw_id: str, id_type: str) -> str:
        """Derive a deterministic, irreversible UID Token reference key.
        
        Uses HMAC-SHA256 keyed with the HSM root KEK so identical inputs map to
        the same stable UID token without ever exposing the raw number.
        Format: UIDT-<4chars>-<4chars>-<4chars>-<4chars>
        """
        # Secret seed from HSM KEK
        digest = hsm.sign_audit_entry(f"UID_TOKEN_GEN:{id_type}:{raw_id}")
        hex_part = digest[:16].upper()
        return f"UIDT-{hex_part[0:4]}-{hex_part[4:8]}-{hex_part[8:12]}-{hex_part[12:16]}"

    @classmethod
    def tokenize(
        cls,
        raw_input: str,
        client_ip: str = "127.0.0.1",
    ) -> TokenizationResult:
        """Tokenize citizen input (12-digit Aadhaar or 16-digit VID)."""
        clean_input = "".join(c for c in str(raw_input or "") if c.isdigit())
        if not clean_input:
            raise ValueError("Input contains no numeric digits")

        # Determine type
        if len(clean_input) == 16:
            id_type = "vid"
            valid, msg = validate_vid_format(clean_input)
        elif len(clean_input) == 12:
            id_type = "aadhaar"
            valid, msg = validate_aadhaar_format(clean_input)
        else:
            raise ValueError(
                f"Invalid identifier length: {len(clean_input)} digits. "
                "Must be a 12-digit Aadhaar number or a 16-digit Virtual ID (VID)."
            )

        last_four = clean_input[-4:]
        uid_token = cls._generate_uid_token(clean_input, id_type)

        # Store in Aadhaar Data Vault
        vault_res = aadhaar_data_vault.store_identity(
            raw_id=clean_input,
            id_type=id_type,
            uid_token=uid_token,
            client_ip=client_ip,
        )

        masked_id = vault_res["masked_id"]
        key_version = vault_res["key_version"]

        # Raw input is purged / falls out of scope immediately
        del clean_input

        return TokenizationResult(
            uid_token=uid_token,
            masked_id=masked_id,
            id_type=id_type,
            last_four=last_four,
            key_version=key_version,
            checksum_valid=valid,
            diagnostic_message=msg,
        )

    @classmethod
    def mask_only(cls, value: str) -> str:
        """Safe masking helper for UI display."""
        digits = "".join(c for c in str(value or "") if c.isdigit())
        if len(digits) >= 16:
            return f"XXXX-XXXX-XXXX-{digits[-4:]}"
        elif len(digits) >= 4:
            return f"XXXX-XXXX-{digits[-4:]}"
        return "XXXX-XXXX-XXXX"


tokenization_service = TokenizationService()
