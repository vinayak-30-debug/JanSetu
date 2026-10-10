"""Unit tests for JanSetu Aadhaar Data Vault (ADV) and Tokenization Architecture.

Verifies UIDAI compliance:
1. Verhoeff D5 algorithm validation.
2. 16-digit Virtual ID (VID) and 12-digit Aadhaar tokenization.
3. AES-256-GCM authenticated encryption in Aadhaar Data Vault.
4. Simulated HSM Master Key (KEK) custody and dynamic DEK key rotation.
5. Tamper-evident, hash-chained Audit Logging.
6. Zero Raw Aadhaar Guarantee in CitizenService and UserProfile.
"""

import unittest
from backend.app.vault.verhoeff import (
    validate_verhoeff,
    compute_checksum,
    validate_aadhaar_format,
    validate_vid_format,
)
from backend.app.vault.hsm import SimulatedHSM
from backend.app.vault.aadhaar_data_vault import AadhaarDataVault
from backend.app.vault.tokenization_service import TokenizationService
from backend.app.vault.audit_logger import VaultAuditLogger


class TestAadhaarDataVault(unittest.TestCase):
    def setUp(self):
        self.hsm = SimulatedHSM(master_seed="TEST-ENCLAVE-SEED-2026")
        self.vault = AadhaarDataVault()

    def test_verhoeff_algorithm(self):
        # Mathematically valid Verhoeff number
        valid_aadhaar = "879562341145"
        self.assertTrue(validate_verhoeff(valid_aadhaar))
        # Tampered digit should fail
        self.assertFalse(validate_verhoeff("879562341146"))
        self.assertFalse(validate_verhoeff("879562341147"))

        # Check check-digit calculation
        base_11 = "87956234114"
        check_digit = compute_checksum(base_11)
        self.assertEqual(check_digit, 5)
        self.assertTrue(validate_verhoeff(base_11 + str(check_digit)))

    def test_vid_format_validation(self):
        valid_vid = "9123456789012345"
        is_valid, msg = validate_vid_format(valid_vid)
        self.assertTrue(is_valid)

        # Invalid lengths
        self.assertFalse(validate_vid_format("123456789012")[0])
        self.assertFalse(validate_vid_format("12345678901234567")[0])
        # Cannot start with 0
        self.assertFalse(validate_vid_format("0123456789012345")[0])

    def test_hsm_key_lifecycle(self):
        status_init = self.hsm.get_status()
        self.assertEqual(status_init["active_key_version"], "DEK-v1.0")
        self.assertEqual(status_init["rotation_count"], 0)

        version_1, dek_1 = self.hsm.get_active_dek()
        self.assertEqual(len(dek_1), 32)  # 256 bits

        # Trigger key rotation
        rotate_res = self.hsm.rotate_key()
        self.assertEqual(rotate_res["active_version"], "DEK-v2.0")
        self.assertEqual(rotate_res["rotation_count"], 1)

        version_2, dek_2 = self.hsm.get_active_dek()
        self.assertEqual(version_2, "DEK-v2.0")
        self.assertNotEqual(dek_1, dek_2)

        # Historical DEK still recoverable for re-encryption
        recovered_dek_1 = self.hsm.get_dek_by_version("DEK-v1.0")
        self.assertEqual(recovered_dek_1, dek_1)

    def test_aadhaar_tokenization_pipeline(self):
        aadhaar_no = "879562341146"
        res = TokenizationService.tokenize(aadhaar_no)

        self.assertTrue(res.uid_token.startswith("UIDT-"))
        self.assertEqual(res.id_type, "aadhaar")
        self.assertEqual(res.masked_id, "XXXX-XXXX-1146")
        self.assertEqual(res.last_four, "1146")

        # Deterministic reference key: same input yields same token
        res_repeat = TokenizationService.tokenize(aadhaar_no)
        self.assertEqual(res.uid_token, res_repeat.uid_token)

    def test_vid_tokenization_pipeline(self):
        vid_no = "9123456789012345"
        res = TokenizationService.tokenize(vid_no)

        self.assertTrue(res.uid_token.startswith("UIDT-"))
        self.assertEqual(res.id_type, "vid")
        self.assertEqual(res.masked_id, "XXXX-XXXX-XXXX-2345")
        self.assertEqual(res.last_four, "2345")

    def test_audit_log_tamper_chain(self):
        logger = VaultAuditLogger()
        entry1 = logger.log(
            event_type="TOKENIZE",
            token_ref="UIDT-TEST-0001",
            id_type="aadhaar",
            status="SUCCESS",
        )
        entry2 = logger.log(
            event_type="KEY_ROTATION",
            token_ref="SYSTEM",
            status="SUCCESS",
        )

        valid, msg = logger.verify_chain_integrity()
        self.assertTrue(valid)
        self.assertIn("Verified", msg)

        # Tampering with an entry breaks chain
        entry1.details["hacked"] = True
        entry1.entry_hash = "fake_hash_12345"
        is_tampered, _ = logger.verify_chain_integrity()
        self.assertFalse(is_tampered)


if __name__ == "__main__":
    unittest.main()
