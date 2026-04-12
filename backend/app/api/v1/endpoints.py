from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Literal, Dict, Any
import traceback

from ...policies.models import UserProfile
from ...orchestration.orchestrator import orchestrator
from ...users.citizen_service import CitizenService
from ...intelligence.llm_service import llm_service
from ...auth.otp_service import OTPService
from ...policies.scheme_rules import get_rule_for_scheme, normalize_scheme_name

router = APIRouter()


class QueryRequest(BaseModel):
    query: str
    profile: Optional[UserProfile] = None
    aadhaar_no: Optional[str] = None


class LLMModeRequest(BaseModel):
    mode: Literal["online", "offline", "auto"]


class SendOtpRequest(BaseModel):
    phone: str


class VerifyOtpRequest(BaseModel):
    phone: str
    code: str


@router.post("/query")
async def main_query(request: QueryRequest):
    """
    Main entry point for BBN intelligence.
    Routes through RAG -> Eligibility -> Decision Layer -> LLM Explanation.
    Supports Aadhaar-based profile auto-fetch if profile is not provided.
    """
    try:
        profile = request.profile or UserProfile(user_id="guest")
        response = await orchestrator.run_query(
            request.query,
            profile,
            request.aadhaar_no,
        )
        return response
    except Exception as e:
        print("\nFULL ERROR TRACE BELOW\n")
        traceback.print_exc()
        raise e


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


@router.get("/citizen/by-aadhaar/{aadhaar_no}")
async def get_citizen_profile(aadhaar_no: str):
    """
    Fetches a profile from the synthetic citizen registry by Aadhaar number.
    Used for profile auto-population in the dashboard.
    """
    profile = await CitizenService.get_by_aadhaar(aadhaar_no)
    if not profile:
        raise HTTPException(status_code=404, detail="Citizen not found in registry")

    return {
        "name": profile.name,
        "aadhaar_no": profile.aadhaar_no,
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
async def send_otp(request: SendOtpRequest):
    try:
        sent, normalized_phone = OTPService.send_otp(request.phone)
        if not sent:
            raise HTTPException(status_code=500, detail="Failed to send OTP")
        return {"ok": True, "phone": normalized_phone, "message": "OTP sent"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Unexpected error sending OTP")


@router.post("/auth/verify-otp")
async def verify_otp(request: VerifyOtpRequest):
    try:
        verified, normalized_phone = OTPService.verify_otp(request.phone, request.code)
        if not verified:
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        return {"ok": True, "phone": normalized_phone, "verified": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except HTTPException:
        raise
    except Exception:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Unexpected error verifying OTP")
