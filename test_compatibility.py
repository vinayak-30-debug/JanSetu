import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_compatibility():
    print("--- Testing BBN Backend-Frontend Compatibility ---")
    
    # 1. Test Citizen Profile
    print("\n1. Testing Citizen Profile (Aadhaar: 123456789012)...")
    try:
        res = requests.get(f"{BASE_URL}/citizen/by-aadhaar/123456789012")
        profile = res.json()
        expected_fields = ["name", "aadhaar_no", "ration_card", "monthly_income", "occupation", "language"]
        for field in expected_fields:
            if field in profile:
                print(f"  [OK] Found {field}: {profile[field]}")
            else:
                print(f"  [FAIL] Missing {field}")
    except Exception as e:
        print(f"  [ERROR] {e}")

    # 2. Test Main Query
    print("\n2. Testing Main Query ('I need health insurance')...")
    try:
        payload = {"query": "I need health insurance"}
        res = requests.post(f"{BASE_URL}/query", json=payload)
        response = res.json()
        expected_fields = ["eligible_policies", "monthly_benefit_value", "ml_prediction", "decision_output", "explanation", "recommended_schemes"]
        for field in expected_fields:
            if field in response:
                print(f"  [OK] Found {field}")
            else:
                print(f"  [FAIL] Missing {field}")
                
        # Deep check
        if "ml_prediction" in response and "approval_likelihood" in response["ml_prediction"]:
            print(f"  [OK] ML Probability: {response['ml_prediction']['approval_likelihood']}")
    except Exception as e:
        print(f"  [ERROR] {e}")

if __name__ == "__main__":
    test_compatibility()
