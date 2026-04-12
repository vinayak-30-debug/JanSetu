from typing import List, Optional, Dict, Any
from .base_agent import BaseAgent
from ..policies.models import UserProfile, Policy, EligibilityResult
from ..policies.scheme_rules import get_rule_for_scheme

class EligibilityAgent(BaseAgent):
    def __init__(self):
        super().__init__(agent_id="eligibility_agent", agent_type="eligibility")

    async def execute(self, query: str = "", context: Optional[Dict[str, Any]] = None, profile: Optional[UserProfile] = None) -> List[EligibilityResult]:
        if not profile or not context or "policies" not in context:
            return []

        policies: List[Policy] = context["policies"]
        results = []

        for policy in policies:
            is_eligible, match_score, reason, matched, missing = self._check_eligibility(profile, policy)
            results.append(EligibilityResult(
                policy_id=policy.policy_id,
                policy_name=policy.name,
                is_eligible=is_eligible,
                match_score=match_score,
                reason=reason,
                matched_criteria=matched,
                missing_criteria=missing
            ))
        
        return results

    def _check_eligibility(self, profile: UserProfile, policy: Policy) -> (bool, float, str, List[str], List[str]):
        criteria = policy.eligibility_criteria
        missing_criteria = []
        matched_criteria = []
        score_weight = 0
        total_checks = 6 # Age, Income, Occupation, State, Disability, Senior
        
        # 1. Age Check
        if profile.age:
            if not (criteria.min_age <= profile.age <= criteria.max_age):
                missing_criteria.append(f"Age range mismatch: {criteria.min_age}-{criteria.max_age}")
            else:
                score_weight += 1
                matched_criteria.append(f"Age within {criteria.min_age}-{criteria.max_age}")
        
        # 2. Income Check
        if profile.income is not None:
            if profile.income > criteria.income_limit:
                missing_criteria.append(f"Income exceeds limit: {criteria.income_limit}")
            else:
                score_weight += 1
                matched_criteria.append(f"Income within limit {criteria.income_limit}")
        
        # 3. Occupation Check
        if criteria.required_occupations != ["any"]:
            profile_occ = (profile.occupation or "").strip().lower()
            required_occ = [(o or "").strip().lower() for o in criteria.required_occupations]
            if profile_occ not in required_occ:
                missing_criteria.append(f"Occupation mismatch: {criteria.required_occupations}")
            else:
                score_weight += 1
                matched_criteria.append(f"Occupation matched {profile.occupation}")
        else:
            score_weight += 1
            matched_criteria.append("Occupation open to any")

        # 4. State Check
        normalized_states = [
            (s or "").strip().lower() for s in criteria.required_states
        ]
        profile_state = (profile.state or "").strip().lower()
        if "all" in normalized_states or "central" in normalized_states:
            score_weight += 1
            matched_criteria.append("State criteria supports all/central")
        elif profile_state and profile_state in normalized_states:
            score_weight += 1
            matched_criteria.append(f"State matched {profile.state}")
        else:
            missing_criteria.append(f"State mismatch: {criteria.required_states}")

        # 5. Disability Check (if policy specifies it as required)
        # Assuming EligibilityCriteria might have a 'requires_disability' flag or we check docs
        # For MVP, we'll check if policy mentions disability in its description/category
        if "disability" in policy.description.lower() or "disability" in policy.category.lower():
            if not profile.disability_status:
                missing_criteria.append("Policy requires disability status")
            else:
                score_weight += 1
                matched_criteria.append("Disability status matched")
        else:
            score_weight += 1
            matched_criteria.append("No disability restriction")

        # 6. Senior Citizen Check
        if "senior" in policy.description.lower() or "senior" in policy.category.lower() or policy.eligibility_criteria.min_age >= 60:
            if not profile.senior_citizen and (profile.age and profile.age < 60):
                 missing_criteria.append("Policy requires senior citizen status (60+)")
            else:
                score_weight += 1
                matched_criteria.append("Senior citizen criteria matched")
        else:
            score_weight += 1
            matched_criteria.append("No senior citizen restriction")

        # 7. Explicit scheme rule checks (state + central criteria packs)
        extra_score, extra_checks, extra_missing = self._evaluate_scheme_rule(profile, policy)
        score_weight += extra_score
        total_checks += extra_checks
        missing_criteria.extend(extra_missing)
        if extra_score > 0:
            matched_criteria.append(f"Matched {extra_score}/{extra_checks} scheme-specific criteria")

        is_eligible = len(missing_criteria) == 0
        match_score = score_weight / total_checks
        reason = "All criteria matched" if is_eligible else f"Missing criteria: {', '.join(missing_criteria)}"
        
        return is_eligible, match_score, reason, matched_criteria, missing_criteria

    def _evaluate_scheme_rule(self, profile: UserProfile, policy: Policy) -> (int, int, List[str]):
        rule = get_rule_for_scheme(policy.name)
        if not rule:
            return 0, 0, []

        missing = []
        passed = 0
        total = 0

        def check(condition: bool, label: str):
            nonlocal passed, total
            total += 1
            if condition:
                passed += 1
            else:
                missing.append(label)

        def check_optional(actual: Any, expected: Any, label: str):
            """
            For simulation/manual inputs, skip checks when a field is not provided.
            This prevents over-filtering state schemes due to missing profile fields.
            """
            if actual is None:
                return
            check(actual == expected, label)

        age = profile.age
        income = profile.income
        monthly_income = (income / 12) if income is not None else None
        occupation_text = (profile.occupation or "").strip().lower()
        inferred_student_status = (
            profile.student_status
            if profile.student_status is not None
            else (occupation_text == "student")
        )

        for key, value in rule.items():
            if key == "min_age":
                if age is not None:
                    check(age >= int(value), f"Age must be >= {value}")
            elif key == "max_age":
                if age is not None:
                    check(age <= int(value), f"Age must be <= {value}")
            elif key == "income_limit":
                if income is not None:
                    check(income <= float(value), f"Income must be <= {value}")
            elif key == "monthly_income_max":
                if monthly_income is not None:
                    check(monthly_income <= float(value), f"Monthly income must be <= {value}")
            elif key == "state":
                check((profile.state or "").strip().lower() == str(value).strip().lower(), f"State must be {value}")
            elif key == "occupation":
                occ = (profile.occupation or "").strip()
                if not occ:
                    check(False, f"Occupation must be {value}")
                else:
                    check(occ.lower() == str(value).strip().lower(), f"Occupation must be {value}")
            elif key == "gender":
                gender = (profile.gender or "").strip()
                if not gender:
                    check(False, f"Gender must be {value}")
                else:
                    check(gender.lower() == str(value).strip().lower(), f"Gender must be {value}")
            elif key == "caste_in":
                allowed = {str(x).strip().upper() for x in value}
                caste = (profile.caste or "").strip().upper()
                if caste:
                    check(caste in allowed, f"Caste must be one of {value}")
            elif key == "ration_card_type_in":
                allowed = {str(x).strip().lower() for x in value}
                ration_type = (profile.ration_card_type or "").strip().lower()
                if ration_type:
                    check(ration_type in allowed, f"Ration card must be one of {value}")
            elif key == "not_income_tax_payer":
                if profile.income_tax_payer is not None:
                    check(profile.income_tax_payer is not True, "Must not be income tax payer")
            elif key == "not_government_employee":
                if profile.government_employee is not None:
                    check(profile.government_employee is not True, "Must not be government employee")
            elif key == "student_status":
                check(bool(inferred_student_status) is bool(value), f"student_status must be {value}")
            else:
                actual = getattr(profile, key, None)
                if isinstance(value, bool):
                    if actual is not None:
                        check(actual is value, f"{key} must be {value}")
                else:
                    check_optional(actual, value, f"{key} must be {value}")

        return passed, total, missing
