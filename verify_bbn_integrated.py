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

# 1. Stub heavy dependencies
sys.modules['google.generativeai'] = MagicMock()
sys.modules['sentence_transformers'] = MagicMock()
sys.modules['faiss'] = MagicMock()

# 2. Mock RAG Retriever
mock_rag = MagicMock()
sys.modules['backend.app.utils.rag_retriever'] = MagicMock(rag_retriever=mock_rag)

# Now import BBN components
from backend.app.orchestration.orchestrator import orchestrator
from backend.app.policies.models import UserProfile, Policy
from backend.app.users.citizen_service import CitizenService
from backend.app.database import db_instance

async def main():
    print(f"--- BBN INTEGRATED REGISTRY VERIFICATION START ---")
    
    # Manually connect mock DB (since we are not running full FastAPI app)
    # We will mock the collection find_one to simulate MongoDB hit
    db_instance.db = MagicMock()
    
    # 3. Test Data - Senior Citizen from Registry (Rohit Nair, 80)
    aadhaar_rohit = "879562341146"
    rohit_registry_data = {
        "Citizen_ID": "BBN-AND-16693",
        "Aadhaar_No": aadhaar_rohit,
        "Full_Name": "Rohit Nair",
        "Gender": "Male",
        "Age": 80,
        "State": "Andhra Pradesh",
        "Annual_Income": 50000,
        "Occupation": "retired",
        "Rural_or_Urban": "Urban",
        "BPL_Status": True,
        "Disability_Status": True,
        "Senior_Citizen": True,
        "Aadhaar_Linked_Mobile": True,
        "Bank_Account": True
    }
    
    # Mock MongoDB find_one
    db_instance.db.citizens.find_one = AsyncMock(return_value=rohit_registry_data)

    # 4. Mock RAG to return a Senior/Disability Policy
    senior_policy = {
        "policy_id": "NSAP-001",
        "name": "National Social Assistance Programme (NSAP) - Old Age & Disability",
        "description": "Monthly pension for seniors and persons with disabilities.",
        "ministry": "Ministry of Rural Development",
        "category": "Social Security",
        "benefits": {"details": "Monthly pension for seniors and persons with disabilities.", "amount": 1000},
        "eligibility_criteria": {
            "min_age": 60,
            "max_age": 100,
            "income_limit": 100000,
            "required_occupations": ["any", "retired"],
            "required_states": ["all"],
            "required_documents": [
                "Aadhar Card",
                "Disability Certificate",
                "Income Certificate"
            ]
        },
        "application_process": ["Apply at local Gram Panchayat", "Submit certificates"]
    }
    mock_rag.retrieve.return_value = [senior_policy]
    mock_rag.retrieve_state_scope.return_value = []
    
    # Mock Explanation Agent
    orchestrator.explanation_agent.execute = AsyncMock(
        return_value={
            "content": "Logic verified: Rohit is eligible for NSAP due to age (80) and disability.",
            "reasoning_details": "Age 80 and disability verified"
        }
    )

    print(f"Simulating Enter Aadhaar: {aadhaar_rohit}")
    
    # Run Orchestrator with Aadhaar
    try:
        # Initial empty profile, orchestrator should fetch Rohit from registry
        empty_profile = UserProfile(user_id="anonymous")
        response = await orchestrator.run_query("I am disabled and old, what help can I get?", empty_profile, aadhaar_no=aadhaar_rohit)
        
        print("\n" + "="*30)
        print(f"CASE ID: {response.get('case_id')}")
        
        pathway = response.get('pathway_context', {})
        print(f"DETECTED PATHWAY: {pathway.get('pathway')}")
        print(f"DETECTION REASONS: {pathway.get('reasons')}")
        
        rta = response.get('rta_summary', {})
        print(f"RTA STATUS: {rta.get('status')}")
        print(f"READINESS SCORE: {rta.get('readiness_score')}")
        
        if response.get('simplified_rta'):
            print("\n--- SIMPLIFIED RTA (ASSISTED MODE) ---")
            srta = response.get('simplified_rta')
            print(f"MESSAGE: {srta.get('status_icon')} {srta.get('main_message')}")
            print(f"MONEY EXPECTED: {srta.get('estimated_money')}")
            print(f"DOCS TO BRING:")
            for d in srta.get('documents_to_bring', []):
                print(f"  {d}")
            print(f"EASY STEPS:")
            for s in srta.get('easy_steps', []):
                print(f"  {s}")
            print(f"BBN TOKEN: {srta.get('bbn_token')}")
            print("--------------------------------------")

        print("\nFULL NEXT STEPS (Standard):")
        for step in rta.get('next_steps', []):
            print(f"- {step}")
        print("="*30)

        # Verification Assertions
        assert pathway.get('pathway') == "ACCESSIBILITY", "Should detect Accessibility due to Rohit's disability status"
        assert response.get('simplified_rta') is not None, "Simplified RTA should be generated for non-direct pathway"
        
        print("\n✅ INCLUSIVE VERIFICATION SUCCESSFUL: Pathway Detection & Simplified RTA validated.")

    except Exception as e:
        print(f"\n❌ VERIFICATION FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
