from typing import Tuple

from ..config import get_settings


def normalize_indian_phone(phone: str) -> str:
    value = (phone or "").strip().replace(" ", "")
    if value.startswith("+"):
        digits = value[1:]
        if not digits.isdigit() or len(digits) < 10:
            raise ValueError("Invalid phone number format")
        return value

    digits_only = "".join(ch for ch in value if ch.isdigit())
    if len(digits_only) == 10:
        return f"+91{digits_only}"
    if len(digits_only) == 12 and digits_only.startswith("91"):
        return f"+{digits_only}"

    raise ValueError("Phone number must be a valid 10-digit Indian mobile number")


class OTPService:
    @staticmethod
    def _twilio_client():
        settings = get_settings()
        if not (
            settings.TWILIO_ACCOUNT_SID
            and settings.TWILIO_AUTH_TOKEN
            and settings.TWILIO_VERIFY_SERVICE_SID
        ):
            raise RuntimeError(
                "Twilio is not configured. Set TWILIO_ACCOUNT_SID, "
                "TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID."
            )

        try:
            from twilio.rest import Client
        except Exception as exc:
            raise RuntimeError("Twilio SDK not installed. Install `twilio` package.") from exc

        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        return client, settings.TWILIO_VERIFY_SERVICE_SID

    @staticmethod
    def send_otp(phone: str) -> Tuple[bool, str]:
        normalized_phone = normalize_indian_phone(phone)
        client, verify_service_sid = OTPService._twilio_client()
        try:
            verification = (
                client.verify.v2.services(verify_service_sid)
                .verifications.create(to=normalized_phone, channel="sms")
            )
        except Exception as exc:
            raise RuntimeError(f"Twilio send failed: {exc}") from exc

        return verification.status in {"pending", "sent"}, normalized_phone

    @staticmethod
    def verify_otp(phone: str, code: str) -> Tuple[bool, str]:
        normalized_phone = normalize_indian_phone(phone)
        otp_code = (code or "").strip()
        if not otp_code.isdigit() or len(otp_code) < 4:
            raise ValueError("OTP must be numeric")

        client, verify_service_sid = OTPService._twilio_client()
        try:
            check = (
                client.verify.v2.services(verify_service_sid)
                .verification_checks.create(to=normalized_phone, code=otp_code)
            )
        except Exception as exc:
            raise RuntimeError(f"Twilio verify failed: {exc}") from exc

        return check.status == "approved", normalized_phone
