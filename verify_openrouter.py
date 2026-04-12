import sys
import os
import asyncio
from unittest.mock import MagicMock, AsyncMock

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

# Mock heavy dependencies BEFORE importing orchestrator to avoid slow loads
from unittest.mock import MagicMock, AsyncMock, patch
import sys

# Mocking sentence_transformers and other heavy AI libs
sys.modules["sentence_transformers"] = MagicMock()
sys.modules["google.generativeai"] = MagicMock()
sys.modules["faiss"] = MagicMock()

# Now import the orchestrator safely
from backend.app.orchestration.orchestrator import BharatOrchestrator
from backend.app.policies.models import UserProfile, Policy

async def verify_openrouter_flow():
    print("--- BBN OPENROUTER INTELLIGENCE VERIFICATION ---")
    
    # 1. Setup Mock User
    user = UserProfile(
        user_id="test-123",
        name="Test Citizen",
        age=30,
        income=5000,
        occupation="Farmer",
        state="Bihar",
        disability_status=False,
        senior_citizen=False
    )
    
    # 2. Mock the LLM Service within the ExplanationAgent
    orchestrator = BharatOrchestrator()
    
    # Mocking the llm_service.generate_with_reasoning call
    mock_llm_response = {
        "content": "You are eligible for PM-KISAN. This scheme provides income support to farmer families.",
        "reasoning_details": "Check age: 30 (OK). Check occupation: Farmer (OK). Check income: 5000 (OK). Conclusion: User meets all rule-based criteria for PM-KISAN."
    }
    
    # Use AsyncMock for the async method
    orchestrator.explanation_agent.execute = AsyncMock(return_value=mock_llm_response)
    
    # Mock RAG to return a dummy policy
    import backend.app.utils.rag_retriever as rag
    rag.rag_retriever.retrieve = MagicMock(return_value=[{
        "scheme_name": "PM-KISAN",
        "benefit": "₹6000 per year",
        "eligibility": ["Farmer", "Land ownership"],
        "category": "Agriculture"
    }])
    
    # 3. Execution
    print("Running query: 'I am a farmer, what can I get?'")
    result = await orchestrator.run_query("I am a farmer, what can I get?", user)
    
    # 4. Assertions
    print("\n==============================")
    print(f"CASE ID: {result['case_id']}")
    print(f"EXPLANATION: {result['explanation']}")
    print(f"APPROVAL LIKELIHOOD: {result['ml_prediction']['approval_likelihood']*100}%")
    print(f"SOCIETY IMPACT: {result['ml_prediction']['impact_analysis']['uplift_score']}")
    print("\n--- BBN REASONER THINKING (INTERNAL) ---")
    print(result['reasoning_details'])
    print("==============================\n")
    
    if "reasoning_details" in result and result["reasoning_details"] == mock_llm_response["reasoning_details"]:
        print("✅ SUCCESS: Reasoning details correctly propagated to orchestrator result.")
    else:
        print("❌ FAILURE: Reasoning details missing or incorrect.")

if __name__ == "__main__":
    asyncio.run(verify_openrouter_flow())
