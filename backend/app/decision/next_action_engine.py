from typing import List, Dict, Any, Optional
from ..policies.models import UserProfile, EligibilityResult, Policy

class NextActionEngine:
    def run(self, profile: UserProfile, eligibility_results: List[EligibilityResult]) -> List[str]:
        actions = []
        
        # 1. Profile Completion
        if not profile.is_complete:
            actions.append("Complete your profile to get more accurate recommendations.")
            
        # 2. Document Suggestions
        if eligibility_results:
            eligible = [r for r in eligibility_results if r.is_eligible]
            if eligible:
                top_scheme = max(eligible, key=lambda x: x.match_score)
                actions.append(f"Apply for {top_scheme.policy_name} as you have a high match score.")
            else:
                actions.append("Upload more documents to improve your eligibility for major schemes.")
                
        return actions
