from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel
from typing import Optional, Literal, Dict, Any
import traceback

from ...policies.models import UserProfile
from ...orchestration.orchestrator import orchestrator
from ...users.citizen_service import CitizenService
from ...intelligence.llm_service import llm_service
from ...auth.otp_service import OTPService
from ...auth.audit import record_audit_event
from ...auth.security import enforce_rate_limit, issue_aadhaar_session, mask_aadhaar, require_aadhaar_session
from ...auth.citizen_id_registry import citizen_id_registry
from ...policies.scheme_rules import get_rule_for_scheme, normalize_scheme_name
from ...config import get_settings

router = APIRouter()


class QueryRequest(BaseModel):
    query: str
    profile: Optional[UserProfile] = None
    citizen_id: Optional[str] = None


class CitizenLookupRequest(BaseModel):
    aadhaar_no: str


class LLMModeRequest(BaseModel):
    mode: Literal["online", "offline", "auto"]


class SendOtpRequest(BaseModel):
    phone: str
    aadhaar_no: Optional[str] = None
    consent: bool = False


class VerifyOtpRequest(BaseModel):
    phone: str
    code: str
    aadhaar_no: Optional[str] = None
    consent: bool = False


@router.post("/query")
async def main_query(request: QueryRequest, http_request: Request):
    """
    Main entry point for BBN intelligence.
    Routes through RAG -> Eligibility -> Decision Layer -> LLM Explanation.
    Accepts an opaque citizen_id (from /citizen/lookup) instead of raw Aadhaar.
    """
    try:
        aadhaar_no: Optional[str] = None
        if request.citizen_id:
            aadhaar_no = citizen_id_registry.resolve(request.citizen_id)
            if not aadhaar_no:
                raise HTTPException(status_code=401, detail="citizen_id is invalid or expired. Please re-verify.")
            enforce_rate_limit(http_request, "aadhaar_query")
            require_aadhaar_session(http_request, aadhaar_no)
        profile = request.profile or UserProfile(user_id="guest")
        response = await orchestrator.run_query(
            request.query,
            profile,
            aadhaar_no,
        )
        return response
    except HTTPException:
        raise
    except Exception:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Unable to process this request")


@router.get("/policies/search")
async def search_policies(q: str):
    from ...utils.rag_retriever import rag_retriever

    policies = rag_retriever.retrieve(q)
    return {"results": policies}


@router.get("/policies/all")
async def get_all_policies():
    """
    Returns the complete scheme catalog grouped by Central and State scope,
    including subsidy/benefit details and full scheme metadata.
    """
    from ...utils.rag_retriever import rag_retriever

    def enrich_policy(policy: Dict[str, Any]) -> Dict[str, Any]:
        eligibility = policy.get("eligibility_criteria", {}) or {}
        states = eligibility.get("required_states", ["all"]) or ["all"]
        normalized_states = [(s or "").strip() for s in states]
        normalized_lower = [s.lower() for s in normalized_states]
        rule = get_rule_for_scheme(policy.get("name", ""))
        rule_state = (rule or {}).get("state")
        if rule_state:
            normalized_states = [str(rule_state)]
            normalized_lower = [str(rule_state).lower()]

        scope = "Central" if ("all" in normalized_lower or "central" in normalized_lower) else "State"

        return {
            **policy,
            "scheme_scope": scope,
            "required_states": normalized_states,
            "subsidy_details": policy.get("benefits", {}),
        }

    all_policies = list(rag_retriever.policies or [])
    enriched = [enrich_policy(p) for p in all_policies]

    # Deduplicate by normalized scheme name and prefer State-scoped copy over Central copy.
    deduped: Dict[str, Dict[str, Any]] = {}
    for policy in enriched:
        key = normalize_scheme_name(policy.get("name", "")) or policy.get("policy_id", "")
        existing = deduped.get(key)
        if not existing:
            deduped[key] = policy
            continue

        if existing.get("scheme_scope") == "Central" and policy.get("scheme_scope") == "State":
            deduped[key] = policy
            continue

        existing_states = existing.get("required_states") or []
        current_states = policy.get("required_states") or []
        if len(current_states) > len(existing_states):
            deduped[key] = policy

    enriched = list(deduped.values())

    central = sorted(
        [p for p in enriched if p.get("scheme_scope") == "Central"],
        key=lambda x: (x.get("name") or "").lower()
    )
    state = sorted(
        [p for p in enriched if p.get("scheme_scope") == "State"],
        key=lambda x: (x.get("name") or "").lower()
    )

    return {
        "total_schemes": len(enriched),
        "central_schemes": central,
        "state_schemes": state,
    }


@router.post("/citizen/lookup")
async def citizen_lookup(request: CitizenLookupRequest, http_request: Request):
    """
    Securely looks up a citizen profile by Aadhaar number.
    Aadhaar is accepted in the POST body (never in the URL).
    Returns an opaque citizen_id for use in subsequent requests.
    """
    aadhaar_no = (request.aadhaar_no or "").strip()
    if not aadhaar_no:
        raise HTTPException(status_code=400, detail="aadhaar_no is required")

    enforce_rate_limit(http_request, "aadhaar_lookup")
    require_aadhaar_session(http_request, aadhaar_no)
    profile = await CitizenService.get_by_aadhaar(aadhaar_no)
    if not profile:
        await record_audit_event("aadhaar_lookup", aadhaar_no, "not_found")
        raise HTTPException(status_code=404, detail="Citizen not found in registry")

    await record_audit_event("aadhaar_lookup", aadhaar_no, "success")
    citizen_id = citizen_id_registry.register(aadhaar_no)

    return {
        "citizen_id": citizen_id,
        "name": profile.name,
        "aadhaar_masked": mask_aadhaar(aadhaar_no),
        "age": profile.age,
        "state": profile.state,
        "caste": profile.caste or "General",
        "gender": profile.gender,
        "ration_card": profile.ration_card_type or "None",
        "monthly_income": profile.monthly_income if profile.monthly_income is not None else round((profile.income or 0) / 12, 2),
        "annual_income": profile.annual_income if profile.annual_income is not None else round(profile.income or 0, 2),
        "occupation": profile.occupation,
        "language": "English",
    }


@router.get("/llm/mode")
async def get_llm_mode():
    return {"mode": llm_service.get_mode()}


@router.post("/llm/mode")
async def set_llm_mode(request: LLMModeRequest):
    return {"mode": llm_service.set_mode(request.mode)}


@router.post("/auth/send-otp")
async def send_otp(request: SendOtpRequest, http_request: Request):
    try:
        enforce_rate_limit(http_request, "otp_send")
        if request.aadhaar_no and not request.consent:
            raise HTTPException(status_code=400, detail="Consent is required to verify a linked mobile number")
        if request.aadhaar_no and not await CitizenService.phone_matches_aadhaar(request.aadhaar_no, request.phone):
            await record_audit_event("otp_send", request.aadhaar_no, "phone_mismatch")
            raise HTTPException(status_code=403, detail="The mobile number cannot be verified for this Aadhaar")
        sent, normalized_phone = OTPService.send_otp(request.phone)
        if not sent:
            raise HTTPException(status_code=500, detail="Failed to send OTP")
        if request.aadhaar_no:
            await record_audit_event("otp_send", request.aadhaar_no, "sent")
        return {"ok": True, "phone": normalized_phone[-4:].rjust(len(normalized_phone), "*"), "message": "OTP sent"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Unexpected error sending OTP")


@router.post("/auth/verify-otp")
async def verify_otp(request: VerifyOtpRequest, response: Response, http_request: Request):
    try:
        enforce_rate_limit(http_request, "otp_verify")
        if request.aadhaar_no and not request.consent:
            raise HTTPException(status_code=400, detail="Consent is required to continue")
        if request.aadhaar_no and not await CitizenService.phone_matches_aadhaar(request.aadhaar_no, request.phone):
            await record_audit_event("otp_verify", request.aadhaar_no, "phone_mismatch")
            raise HTTPException(status_code=403, detail="The mobile number cannot be verified for this Aadhaar")
        verified, normalized_phone = OTPService.verify_otp(request.phone, request.code)
        if not verified:
            if request.aadhaar_no:
                await record_audit_event("otp_verify", request.aadhaar_no, "failed")
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        if request.aadhaar_no:
            token = issue_aadhaar_session(normalized_phone, request.aadhaar_no)
            settings = get_settings()
            response.set_cookie("jansetu_aadhaar_session", token, httponly=True, secure=not settings.DEBUG,
                                samesite="strict", max_age=settings.AUTH_SESSION_TTL_MINUTES * 60)
            await record_audit_event("otp_verify", request.aadhaar_no, "verified")
        return {"ok": True, "phone": normalized_phone[-4:].rjust(len(normalized_phone), "*"), "verified": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except HTTPException:
        raise
    except Exception:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Unexpected error verifying OTP")
