from typing import List, Dict, Any, Optional
import math
from ..agents.eligibility_agent import EligibilityAgent
from ..agents.explanation_agent import ExplanationAgent
from ..decision.decision_engine import DecisionEngine
from ..decision.case_service import CaseService
from ..decision.pathway_detector import PathwayDetector
from ..users.citizen_service import CitizenService
from ..intelligence.prediction_service import prediction_service
from ..utils.rag_retriever import rag_retriever
from ..policies.models import UserProfile, Policy
from ..policies.scheme_rules import get_rule_for_scheme
from ..auth.security import mask_aadhaar


class BharatOrchestrator:
    _STATE_NAMES = [
        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
        "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
        "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
        "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
        "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"
    ]

    def __init__(self):
        self.eligibility_agent = EligibilityAgent()
        self.explanation_agent = ExplanationAgent()
        self.decision_engine = DecisionEngine()

    async def run_query(
        self,
        query: str,
        profile: UserProfile,
        aadhaar_no: Optional[str] = None
    ) -> Dict[str, Any]:
        # Guided flow: ask Aadhaar first for guest mode.
        if not aadhaar_no and (not profile or profile.user_id == "guest"):
            return {
                "query": query,
                "case_id": None,
                "eligible_policies": 0,
                "eligible_schemes": [],
                "not_eligible_schemes": [],
                "monthly_benefit_value": 0,
                "ml_prediction": {"approval_likelihood": 0.0},
                "decision_output": {"document_advice": []},
                "explanation": (
                    "Please enter your 12-digit Aadhaar number first. "
                    "If profile exists, I will use it directly. "
                    "If not found, I will collect a few details and then show eligible Central and State schemes."
                ),
                "reasoning_details": (
                    "Aadhaar -> profile lookup -> eligibility.\n"
                    "If not found: smart intake (max 7 questions) -> eligibility."
                ),
                "recommended_schemes": []
            }

        # 0. Registry Lookup - If Aadhaar provided, fetch fresh profile
        if aadhaar_no:
            registry_profile = await CitizenService.get_by_aadhaar(aadhaar_no)
            if registry_profile:
                profile = registry_profile
                print(
                    f"Orchestrator: Using registry profile for "
                    f"{profile.name} (Aadhaar: {mask_aadhaar(aadhaar_no)})"
                )

        # If core profile is incomplete, ask only missing required fields.
        missing_fields = []
        if not profile.age:
            missing_fields.append("age")
        if not profile.state:
            missing_fields.append("state")
        if not profile.gender:
            missing_fields.append("gender")
        if not profile.occupation:
            missing_fields.append("occupation")
        if missing_fields:
            return {
                "query": query,
                "case_id": None,
                "eligible_policies": 0,
                "eligible_schemes": [],
                "not_eligible_schemes": [],
                "monthly_benefit_value": 0,
                "ml_prediction": {"approval_likelihood": 0.0},
                "decision_output": {"document_advice": []},
                "explanation": (
                    "Profile is incomplete. Please provide: "
                    + ", ".join(missing_fields)
                ),
                "reasoning_details": "Required missing fields detected before eligibility evaluation.",
                "recommended_schemes": []
            }

        # 1. Enhanced RAG Retrieval - Find relevant policies
        occupation = profile.occupation or "unknown"
        state = profile.state or "India"
        caste = profile.caste or "general"

        # 🔥 PERMANENT NULL SAFETY FIX
        profile.occupation = occupation
        profile.state = state
        profile.caste = caste

        enhanced_query = (
            f"{query}. Profile: {occupation} in {state}. "
            f"Caste: {caste}."
        )

        # Deterministic scope: always evaluate central + selected state schemes.
        state_scoped = rag_retriever.retrieve_state_scope(state=state)
        # Keep semantic ranking as a secondary signal and merge.
        semantic_ranked = rag_retriever.retrieve(enhanced_query, state=state, top_k=25)
        seen_ids = set()
        relevant_policies = []
        for p in (state_scoped + semantic_ranked):
            pid = p.get("policy_id")
            if pid in seen_ids:
                continue
            relevant_policies.append(p)
            seen_ids.add(pid)

        # Convert List[Dict] to List[Policy]
        policy_models = []
        for p in relevant_policies:
            try:
                policy_models.append(Policy(**p))
            except Exception as e:
                print(
                    f"Skipping incompatible policy "
                    f"{p.get('name', 'unknown')}: {e}"
                )

        # Enforce scope strictly: Central + citizen's state only.
        # Remove out-of-state schemes that may have been normalized as central.
        profile_state = (profile.state or "").strip().lower()
        scoped_policies: List[Policy] = []
        for policy in policy_models:
            # 1) Scheme-rule state constraint (strongest signal).
            rule = get_rule_for_scheme(policy.name)
            rule_state = (rule or {}).get("state")
            if rule_state and profile_state and str(rule_state).strip().lower() != profile_state:
                continue

            # 2) Name-based state detection fallback.
            name_lower = (policy.name or "").lower()
            inferred_state = None
            for st in self._STATE_NAMES:
                if st.lower() in name_lower:
                    inferred_state = st.lower()
                    break
            if inferred_state and profile_state and inferred_state != profile_state:
                continue

            scoped_policies.append(policy)

        policy_models = scoped_policies

        # 2. Eligibility Intelligence
        eligibility_results = await self.eligibility_agent.execute(
            query=query,
            context={"policies": policy_models},
            profile=profile
        )

        # 3. ML Scoring & Impact Forecasting
        ml_score = 0.0
        impact_analysis = {}

        if policy_models:
            top_policy = policy_models[0]
            ml_score = prediction_service.predict_eligibility_likelihood(
                profile,
                top_policy
            )
            impact_analysis = prediction_service.predict_impact_score(
                profile,
                top_policy
            )

        # 4. Decision Layer
        decision_output = self.decision_engine.run(
            profile=profile,
            eligibility_results=eligibility_results,
            policies=policy_models,
            ml_score=ml_score
        )

        # 5. Case ID & RTA Summary
        case_id = CaseService.generate_case_id()

        eligible_policy_ids = [
            r.policy_id for r in eligibility_results if r.is_eligible
        ]
        eligibility_by_policy = {r.policy_id: r for r in eligibility_results}

        eligible_policies = [
            p for p in policy_models
            if p.policy_id in eligible_policy_ids
        ]
        not_eligible_policies = [
            p for p in policy_models
            if p.policy_id not in eligible_policy_ids
        ]

        rta_summary = CaseService.generate_rta_summary(
            case_id=case_id,
            eligible_policies=eligible_policies,
            readiness_data=decision_output.get("document_advice", {}),
            optimization_data=decision_output.get("optimization", {})
        )

        # 6. LLM Explanation
        final_explanation = "No eligible schemes found to explain."
        reasoning_details = None

        if policy_models:
            top_policy = policy_models[0]
            explanation_data = await self.explanation_agent.execute(
                query=query,
                context={
                    "policy": top_policy,
                    "decision_output": decision_output
                },
                profile=profile
            )

            final_explanation = explanation_data.get("content", "")
            reasoning_details = explanation_data.get(
                "reasoning_details"
            )

        # 7. Inclusive Pathway Detection
        pathway_context = PathwayDetector.detect_pathway(profile)

        # 8. Simplified RTA
        simplified_rta = None
        if pathway_context["pathway"] != "DIRECT":
            simplified_rta = CaseService.generate_simplified_rta(
                rta_summary
            )

        def scheme_scope(policy: Policy) -> str:
            states = [
                (s or "").strip().lower()
                for s in policy.eligibility_criteria.required_states
            ]
            return "Central" if ("all" in states or "central" in states) else "State"

        def estimated_benefit(policy: Policy) -> Any:
            benefits = policy.benefits or {}
            if isinstance(benefits, dict):
                return (
                    benefits.get("amount")
                    or benefits.get("coverage")
                    or benefits.get("details")
                    or "N/A"
                )
            return benefits or "N/A"

        payload = {
            "query": query,
            "case_id": case_id,
            "eligible_policies": len(eligible_policy_ids),
            "eligible_schemes": [
                {
                    **p.dict(),
                    "scheme_scope": scheme_scope(p),
                    "reason_eligible": "; ".join(
                        eligibility_by_policy.get(p.policy_id).matched_criteria
                    ) if eligibility_by_policy.get(p.policy_id) else "Criteria matched",
                    "estimated_benefit": estimated_benefit(p),
                }
                for p in eligible_policies
            ],
            "not_eligible_schemes": [
                {
                    **p.dict(),
                    "scheme_scope": scheme_scope(p),
                    "reason_not_eligible": "; ".join(
                        eligibility_by_policy.get(p.policy_id).missing_criteria
                    ) if eligibility_by_policy.get(p.policy_id) else "Criteria mismatch",
                    "estimated_benefit": estimated_benefit(p),
                }
                for p in not_eligible_policies
            ],
            "monthly_benefit_value": rta_summary.get(
                "total_benefit_value", 0.0
            ),
            "ml_prediction": {
                "approval_likelihood": ml_score
            },
            "decision_output": {
                "document_advice": rta_summary.get(
                    "missing_documents", []
                )
            },
            "explanation": final_explanation,
            "reasoning_details": reasoning_details,
            "recommended_schemes": []
        }
        return self._json_safe(payload)

    def _json_safe(self, obj: Any) -> Any:
        """
        Recursively sanitize response payload so Starlette JSON encoding
        never fails on NaN/Infinity values.
        """
        if isinstance(obj, float):
            return obj if math.isfinite(obj) else None
        if isinstance(obj, dict):
            return {k: self._json_safe(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [self._json_safe(v) for v in obj]
        return obj


# Singleton
orchestrator = BharatOrchestrator()
