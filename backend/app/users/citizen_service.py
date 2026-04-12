import json
from pathlib import Path
from typing import Optional, Dict, Any, List
from pymongo.errors import PyMongoError
from ..policies.models import UserProfile
from ..database import get_database


class CitizenService:
    _local_registry_by_aadhaar: Optional[Dict[str, Dict[str, Any]]] = None

    @staticmethod
    async def get_by_aadhaar(aadhaar_no: str) -> Optional[UserProfile]:
        """
        Fetches a citizen profile from MongoDB and falls back to local JSON registry
        if DB is unavailable or record is missing.
        """
        aadhaar_str = str(aadhaar_no).strip()
        citizen_data = None

        db = get_database()
        if db is not None:
            # Aadhaar may be stored as int or string depending on ingestion path.
            query = {"Aadhaar_No": aadhaar_str}
            if aadhaar_str.isdigit():
                query_terms = []
                for variant in CitizenService._aadhaar_variants(aadhaar_str):
                    query_terms.append({"Aadhaar_No": variant})
                    try:
                        query_terms.append({"Aadhaar_No": int(variant)})
                    except ValueError:
                        pass
                query = {"$or": query_terms}
            try:
                citizen_data = await db.citizens.find_one(query)
            except PyMongoError:
                # Mongo might be down locally; fall back to bundled citizens.json.
                citizen_data = None

        # Fallback to local dataset so dashboard works even before Mongo import.
        if not citizen_data:
            citizen_data = CitizenService._find_in_local_registry(aadhaar_str)

        if not citizen_data:
            return None

        # Map registry fields to UserProfile
        docs = []
        if citizen_data.get("Aadhaar_No"):
            docs.append("Aadhar Card")
        if citizen_data.get("Voter_ID"):
            docs.append("Voter ID")
        if citizen_data.get("Driving_License"):
            docs.append("Driving License")
        if citizen_data.get("PAN_No"):
            docs.append("PAN Card")
        if citizen_data.get("Bank_Account"):
            docs.append("Bank Account Details")
        if citizen_data.get("Ration_Card_Type"):
            docs.append("Ration Card")

        monthly_income_raw = float(citizen_data.get("Monthly_Income") or 0)
        annual_income_raw = float(citizen_data.get("Annual_Income") or 0)
        monthly_income = monthly_income_raw if monthly_income_raw > 0 else round(annual_income_raw / 12, 2)
        annual_income = annual_income_raw if annual_income_raw > 0 else round(monthly_income * 12, 2)

        profile_dict = {
            "user_id": citizen_data.get("Citizen_ID"),
            "aadhaar_no": str(citizen_data.get("Aadhaar_No", "")),
            "name": citizen_data.get("Full_Name"),
            "age": citizen_data.get("Age"),
            "income": annual_income,
            "monthly_income": monthly_income,
            "annual_income": annual_income,
            "occupation": citizen_data.get("Occupation", "").capitalize(),
            "state": citizen_data.get("State"),
            "caste": citizen_data.get("Caste_Category") or "General",
            "gender": citizen_data.get("Gender"),
            "residency_type": citizen_data.get("Rural_or_Urban"),
            "ration_card": True if citizen_data.get("Ration_Card_Type") else False,
            "ration_card_type": citizen_data.get("Ration_Card_Type"),
            "bpl_status": citizen_data.get("BPL_Status", False),
            "disability_status": citizen_data.get("Disability_Status", False),
            "senior_citizen": citizen_data.get("Senior_Citizen", False),
            "land_ownership": citizen_data.get("Land_Ownership"),
            "bank_account": citizen_data.get("Bank_Account"),
            "student_status": citizen_data.get("Student_Status"),
            "indian_citizen": True,
            "income_tax_payer": False,
            "institutional_landholder": False,
            "included_in_secc_2011": citizen_data.get("BPL_Status", False),
            "no_family_size_limit": True,
            "no_pucca_house": not bool(citizen_data.get("House_Ownership")),
            "first_time_home_buyer": not bool(citizen_data.get("House_Ownership")),
            "enrolled_in_recognized_institution": citizen_data.get("Student_Status", False),
            "head_of_family": True,
            "government_employee": (citizen_data.get("Occupation", "").lower() in ["govt employee", "government employee"]),
            "ration_card_holder": bool(citizen_data.get("Ration_Card_Type")),
            "electricity_connection": bool(citizen_data.get("House_Ownership")),
            "resident": True,
            "family_income": annual_income,
            "maximum_two_girl_children": False,
            "education_completed": citizen_data.get("Education_Level") not in [None, "", "No Schooling"],
            "female_head_of_family": (citizen_data.get("Gender", "").lower() == "female"),
            "informal_worker": (citizen_data.get("Employment_Type", "").lower() == "informal"),
            "no_lpg_connection": not bool(citizen_data.get("House_Ownership")),
            "uploaded_documents": docs,
            "is_complete": True,
        }

        return UserProfile(**profile_dict)

    @staticmethod
    def _find_in_local_registry(aadhaar_no: str) -> Optional[Dict[str, Any]]:
        if CitizenService._local_registry_by_aadhaar is None:
            CitizenService._local_registry_by_aadhaar = CitizenService._load_local_registry_index()

        aadhaar_str = str(aadhaar_no).strip()
        if not aadhaar_str:
            return None
        for variant in CitizenService._aadhaar_variants(aadhaar_str):
            citizen = CitizenService._local_registry_by_aadhaar.get(variant)
            if citizen:
                return citizen
        return None

    @staticmethod
    def _aadhaar_variants(aadhaar_no: str) -> List[str]:
        aadhaar = str(aadhaar_no).strip()
        if not aadhaar:
            return []

        variants: List[str] = [aadhaar]
        if aadhaar.isdigit():
            stripped = str(int(aadhaar)) if int(aadhaar) != 0 else "0"
            if stripped not in variants:
                variants.append(stripped)
            padded12 = aadhaar.zfill(12)
            if padded12 not in variants:
                variants.append(padded12)

            # Dataset quality fallback: if user enters 12 digits but data has 11.
            if len(aadhaar) == 12:
                drop_last = aadhaar[:-1]
                if drop_last not in variants:
                    variants.append(drop_last)
                drop_first = aadhaar[1:]
                if drop_first not in variants:
                    variants.append(drop_first)
        return variants

    @staticmethod
    def _load_local_registry_index() -> Dict[str, Dict[str, Any]]:
        data_path = Path(__file__).resolve().parents[2] / "data" / "citizens.json"
        if not data_path.exists():
            return {}

        try:
            with data_path.open("r", encoding="utf-8") as f:
                citizens = json.load(f)
        except Exception:
            return {}

        index: Dict[str, Dict[str, Any]] = {}
        for citizen in citizens:
            key = str(citizen.get("Aadhaar_No", "")).strip()
            if key:
                index[key] = citizen
        return index
