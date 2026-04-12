from typing import List, Dict, Any
from ..policies.models import UserProfile, Policy

class DocumentAdvisor:
    def run(self, profile: UserProfile, eligible_policies: List[Policy]) -> Dict[str, Any]:
        all_required_docs = set()
        for p in eligible_policies:
            all_required_docs.update(p.eligibility_criteria.required_documents)
            
        uploaded_docs = set(profile.uploaded_documents)
        missing_documents = list(all_required_docs - uploaded_docs)
        
        total_req = len(all_required_docs)
        readiness_score = (total_req - len(missing_documents)) / total_req if total_req > 0 else 1.0
        
        return {
            "readiness_score": round(readiness_score, 2),
            "missing_documents": missing_documents
        }
