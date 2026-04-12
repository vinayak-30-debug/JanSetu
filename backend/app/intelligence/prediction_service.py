import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from typing import Dict, Any, List
from ..policies.models import UserProfile, Policy


class PredictionService:
    def __init__(self):
        # In a real scenario, these would be pre-trained models loaded from disk
        # For the hackathon MVP, we use "Cold-Start" models with basic weights
        # to demonstrate the predictive intelligence.
        self.approval_model = RandomForestClassifier(n_estimators=10)
        self.impact_model = RandomForestRegressor(n_estimators=10)

        # Seed the models with some dummy demographic-to-success patterns
        self._seed_models()

    def _seed_models(self):
        """
        Creates a synthetic training set to simulate predictive trends:
        - Higher income = lower approval for BPL schemes.
        - Matching occupation = higher approval.
        - Document readiness = higher approval.
        """
        # X: [age, income, occupation_code, docs_uploaded]
        # Y_approval: [0 or 1]
        # Y_impact: [score 0-100]
        X = np.array([
            [25, 2000, 1, 5], [45, 15000, 2, 2], [65, 3000, 1, 8],
            [30, 50000, 3, 1], [55, 8000, 2, 6], [20, 1000, 1, 4]
        ])
        y_approval = np.array([1, 0, 1, 0, 1, 1])
        y_impact = np.array([85, 20, 95, 10, 70, 90])

        self.approval_model.fit(X, y_approval)
        self.impact_model.fit(X, y_impact)

    def predict_eligibility_likelihood(
        self,
        profile: UserProfile,
        policy: Policy
    ) -> float:
        """
        Predicts the % probability of successful approval.
        """
        # Feature Engineering
        features = self._extract_features(profile)

        # Get probability of class '1' (Approved)
        prob = self.approval_model.predict_proba([features])[0][1]

        # Boost probability if specific keywords match policy metadata
        if profile.occupation and profile.occupation.lower() in policy.description.lower():
            prob = min(0.99, prob + 0.15)

        return round(float(prob), 2)

    def predict_impact_score(
        self,
        profile: UserProfile,
        policy: Policy
    ) -> Dict[str, Any]:
        """
        Predicts the socio-economic uplift score.
        """
        features = self._extract_features(profile)
        raw_score = self.impact_model.predict([features])[0]

        # ✅ SAFE FIX: prevent NoneType comparison
        income_value = profile.income or 0
        age_value = profile.age or 0

        return {
            "uplift_score": round(float(raw_score), 1),
            "primary_benefit":
                "Financial Stability" if income_value < 10000 else "Service Access",
            "social_security_index":
                "+12.5%" if age_value > 60 else "+8.2%"
        }

    def _extract_features(self, profile: UserProfile) -> List[float]:
        # Encode occupation (Farmer=1, Student=2, Worker=3, etc.)
        occ_map = {
            "Farmer": 1,
            "Student": 2,
            "Unemployed": 3,
            "Senior": 4
        }

        occ_code = occ_map.get(profile.occupation, 0)

        return [
            float(profile.age or 30),
            float(profile.income or 10000),
            float(occ_code),
            float(len(profile.uploaded_documents or []))
        ]


# Singleton
prediction_service = PredictionService()