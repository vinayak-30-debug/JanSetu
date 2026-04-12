from typing import List, Dict, Any, Optional
from ..policies.models import UserProfile, EligibilityResult, Policy
from .next_action_engine import NextActionEngine
from .optimization_engine import OptimizationEngine
from .document_advisor import DocumentAdvisor
from .explainability_engine import ExplainabilityEngine

class DecisionEngine:
    def __init__(self):
        self.next_action = NextActionEngine()
        self.optimization = OptimizationEngine()
        self.document_advisor = DocumentAdvisor()
        self.explainability = ExplainabilityEngine()

    def run(
        self,
        profile: UserProfile,
        eligibility_results: List[EligibilityResult],
        policies: List[Policy],
        ml_score: float = 0.0
    ) -> Dict[str, Any]:
        """
        Aggregates outputs from all decision sub-engines.
        """
        eligible_policies = [p for p in policies if p.policy_id in [r.policy_id for r in eligibility_results if r.is_eligible]]
        
        return {
            "next_actions": self.next_action.run(profile, eligibility_results),
            "optimization": self.optimization.run(eligibility_results, policies),
            "document_advice": self.document_advisor.run(profile, eligible_policies),
            "explainability": self.explainability.run(eligibility_results),
            "claim_prediction": {
                "success_probability": ml_score,
                "confidence": "High" if ml_score > 0.7 else "Medium"
            }
        }
