from typing import List, Dict, Any
from ..policies.models import EligibilityResult

class ExplainabilityEngine:
    def run(self, eligibility_results: List[EligibilityResult]) -> Dict[str, Any]:
        # Aggregate reasoning for the top match
        if not eligibility_results:
            return {"reason": "No policies evaluated", "key_factors": []}
            
        top_result = max(eligibility_results, key=lambda x: x.match_score)
        
        return {
            "reason": top_result.reason,
            "key_factors": [
                f"{top_result.policy_name}: Match Score {int(top_result.match_score * 100)}%"
            ]
        }
