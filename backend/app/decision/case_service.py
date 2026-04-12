import uuid
from datetime import datetime
from typing import List, Dict, Any
from ..policies.models import Policy


class CaseService:
    @staticmethod
    def generate_case_id() -> str:
        """Generates a unique BBN Case ID."""
        timestamp = datetime.now().strftime("%Y%m%d")
        unique_part = str(uuid.uuid4()).split("-")[0].upper()
        return f"BBN-{timestamp}-{unique_part}"

    @staticmethod
    def generate_rta_summary(
        case_id: str,
        eligible_policies: List[Policy],
        readiness_data: Dict[str, Any],
        optimization_data: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Aggregates eligibility, readiness, and optimization into a
        Ready-to-Apply (RTA) Summary.
        """
        missing_docs = readiness_data.get("missing_documents", [])
        readiness_score = readiness_data.get("readiness_score", 0.0)

        status = "READY_TO_APPLY" if readiness_score >= 1.0 else "ACTION_REQUIRED"

        next_steps = []
        if status == "ACTION_REQUIRED":
            next_steps.append(f"Obtain missing documents: {', '.join(missing_docs)}")

        for p in eligible_policies:
            if hasattr(p, "application_process") and p.application_process:
                next_steps.extend(p.application_process[:2])

        total_benefit_value = float(optimization_data.get("total_estimated_benefit", 0.0) or 0.0)
        total_benefit_display = optimization_data.get(
            "total_estimated_benefit_display",
            f"Rs {total_benefit_value:,.2f}",
        )

        return {
            "case_id": case_id,
            "status": status,
            "readiness_score": readiness_score,
            "missing_documents": missing_docs,
            "recommended_schemes": optimization_data.get("recommended_schemes", []),
            "total_benefit": total_benefit_display,
            "total_benefit_value": total_benefit_value,
            "next_steps": list(set(next_steps)),
            "generated_at": datetime.now().isoformat(),
        }

    @staticmethod
    def generate_simplified_rta(rta_summary: Dict[str, Any]) -> Dict[str, Any]:
        """
        Creates an ultra-simplified, icon-ready version of the RTA summary.
        """
        return {
            "status_icon": "OK" if rta_summary["status"] == "READY_TO_APPLY" else "WARN",
            "main_message": "You are ready!" if rta_summary["status"] == "READY_TO_APPLY" else "Small actions needed",
            "documents_to_bring": [f"DOC {doc}" for doc in rta_summary.get("missing_documents", [])],
            "estimated_money": rta_summary.get("total_benefit", "Rs 0.00"),
            "easy_steps": [f"STEP {step}" for step in rta_summary.get("next_steps", [])[:3]],
            "bbn_token": rta_summary["case_id"][-6:],
        }
