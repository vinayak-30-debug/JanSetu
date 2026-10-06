import sys
import os
import asyncio
import json
from unittest.mock import MagicMock, AsyncMock

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Add backend to path
sys.path.append(os.getcwd())
sys.path.append(os.path.join(os.getcwd(), "backend"))

# 1. TOTAL STUBBING of heavy dependencies to avoid environment crashes
sys.modules['google.generativeai'] = MagicMock()
sys.modules['sentence_transformers'] = MagicMock()
sys.modules['faiss'] = MagicMock()

# 2. Mock RAG Retriever BEFORE importing Orchestrator
# This ensures rag_retriever.retrieve doesn't try to load model/faiss index
mock_rag = MagicMock()
sys.modules['backend.app.utils.rag_retriever'] = MagicMock(rag_retriever=mock_rag)

# Now import BBN components
from backend.app.orchestration.orchestrator import orchestrator
from backend.app.policies.models import UserProfile, Policy

async def main():
    # Load sample citizen
    citizens_path = os.path.join("backend", "data", "sample_citizens.json")
    with open(citizens_path, "r") as f:
        citizens = json.load(f)
    
    # Use Rohit (farmer) - citizen_001
    rohit = UserProfile(**citizens[0])
    
    # Load and normalize PM-KISAN
    pm_kisan_path = os.path.join("backend", "data", "knowledge_base", "central", "pradhan_mantri_kisan_samman_nidhi_(pm-kisan).json")
    with open(pm_kisan_path, "r", encoding="utf-8") as f:
        raw_pm_kisan = json.load(f)

    pm_kisan_policy = {
        "policy_id": "PM-KISAN-001",
        "name": raw_pm_kisan.get("scheme_name", "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)"),
        "description": raw_pm_kisan.get("benefit", "Income support for farmer families"),
        "ministry": "Ministry of Agriculture & Farmers Welfare",
        "category": raw_pm_kisan.get("category", "Farmer"),
        "benefits": {"details": raw_pm_kisan.get("benefit", ""), "amount": 6000},
        "eligibility_criteria": {
            "min_age": 18,
            "max_age": 100,
            "income_limit": 1000000,
            "required_occupations": ["farmer", "any"],
            "required_states": ["all"],
            "required_documents": raw_pm_kisan.get("eligibility", ["Aadhar Card", "Land Records", "Bank Account Details"])
        },
        "application_process": raw_pm_kisan.get("application_process", [])
    }
    
    # 3. CONFIGURE MOCKS
    # Mock RAG to return PM-KISAN
    mock_rag.retrieve.return_value = [pm_kisan_policy]
    mock_rag.retrieve_state_scope.return_value = []
    
    # Mock Explanation Agent
    orchestrator.explanation_agent.execute = AsyncMock(
        return_value={
            "content": "Mocked Explanation for PM-KISAN.",
            "reasoning_details": "PM-KISAN verified for farmer"
        }
    )

    print(f"--- BBN STUBBED VERIFICATION START ---")
    print(f"Testing for Citizen: {rohit.name}")
    print(f"Uploaded Docs: {rohit.uploaded_documents}")
    
    # Run Orchestrator
    try:
        # We call run_query. orchestrator.py will use its own internal logic 
        # but with our mocked dependencies.
        response = await orchestrator.run_query("I am a farmer", rohit)
        
        print("\n" + "="*30)
        print(f"CASE ID: {response.get('case_id')}")
        
        rta = response.get('rta_summary', {})
        print(f"RTA STATUS: {rta.get('status')}")
        print(f"READINESS SCORE: {rta.get('readiness_score')}")
        
        print("\nRECOMMENDED SCHEMES:")
        for scheme in rta.get('recommended_schemes', []):
            print(f"- {scheme}")
            
        print("\nMISSING DOCUMENTS:")
        for doc in rta.get('missing_documents', []):
            print(f"- {doc}")

        print("\nNEXT STEPS (RTA PACKET):")
        for step in rta.get('next_steps', []):
            print(f"- {step}")
        print("="*30)

        # Verification Assertions
        assert response.get('case_id').startswith("BBN-202"), "Case ID format incorrect"
        assert "Land Records" in rta.get('missing_documents'), "Failed to identify missing Land Records"
        assert rta.get('status') == "ACTION_REQUIRED", "Incorrect RTA status"
        
        print("\n✅ VERIFICATION SUCCESSFUL: Decision Intelligence and RTA Flow validated.")

    except Exception as e:
        print(f"\n❌ VERIFICATION FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
