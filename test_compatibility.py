import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_compatibility():
    print("--- Testing BBN Backend-Frontend Compatibility ---")
    
    # 1. Test Health Check
    print("\n1. Testing Health Check...")
    try:
        res = requests.get(f"{BASE_URL}/health")
        if res.status_code == 200:
            print(f"  [OK] Health check passed: {res.json()}")
        else:
            print(f"  [FAIL] Health check returned status {res.status_code}")
    except Exception as e:
        print(f"  [ERROR] Backend unreachable: {e}")
        return

    # 2. Test Policy Catalog
    print("\n2. Testing Policy Catalog...")
    try:
        res = requests.get(f"{BASE_URL}/policies/all")
        if res.status_code == 200:
            data = res.json()
            print(f"  [OK] Policy catalog returned {data.get('total_schemes', 0)} total schemes")
        else:
            print(f"  [FAIL] Policies endpoint returned status {res.status_code}")
    except Exception as e:
        print(f"  [ERROR] {e}")

    # 3. Test Security Middleware (Aadhaar in URL must be blocked)
    print("\n3. Testing Aadhaar-in-URL Security Middleware...")
    try:
        res = requests.get(f"{BASE_URL}/citizen/by-aadhaar/123456789012")
        if res.status_code == 400:
            print(f"  [OK] Successfully blocked raw Aadhaar in URL with status 400")
        else:
            print(f"  [WARN] Expected status 400 but received {res.status_code}")
    except Exception as e:
        print(f"  [ERROR] {e}")

    # 4. Test Main Query (Guest Mode)
    print("\n4. Testing Main Query ('I need health insurance')...")
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
                
        if "ml_prediction" in response and "approval_likelihood" in response["ml_prediction"]:
            print(f"  [OK] ML Probability: {response['ml_prediction']['approval_likelihood']}")
    except Exception as e:
        print(f"  [ERROR] {e}")

if __name__ == "__main__":
    test_compatibility()
