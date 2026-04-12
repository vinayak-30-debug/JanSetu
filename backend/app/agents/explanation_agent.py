from typing import List, Dict, Any, Optional
from .base_agent import BaseAgent
from ..policies.models import UserProfile, Policy
from ..intelligence.llm_service import llm_service

class ExplanationAgent(BaseAgent):
    def __init__(self):
        super().__init__(agent_id="explanation_agent", agent_type="explanation")

    async def execute(self, query: str, context: Optional[Dict[str, Any]] = None, profile: Optional[UserProfile] = None) -> Dict[str, Any]:
        if not context or "policy" not in context:
            return {"content": "No policy context provided for explanation.", "reasoning_details": None}

        policy: Policy = context["policy"]
        decision_data = context.get("decision_output", {})

        prompt = f"""
        You are a welfare policy expert for Bharat Benefits Navigator.
        
        Policy: {policy.name}
        Description: {policy.description}
        Benefits: {policy.benefits}
        Eligibility: {policy.eligibility_criteria}
        
        User Context:
        - Eligibility Match: {decision_data.get('explainability', {}).get('reason', 'N/A')}
        - Next Steps: {decision_data.get('next_actions', [])}
        - Readiness Score: {decision_data.get('document_advice', {}).get('readiness_score', 0)}
        
        Task: 
        Provide a concise, empathetic, and clear explanation of this policy for the user.
        Focus on "What's in it for them" and "What they should do next".
        Keep it simple and avoid jargon.
        """
        
        messages = [{"role": "user", "content": prompt}]
        return await llm_service.generate_with_reasoning(messages)
