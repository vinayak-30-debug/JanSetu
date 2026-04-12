from typing import Dict, Any, Optional


def _norm(name: str) -> str:
    return "".join(ch.lower() if ch.isalnum() else " " for ch in (name or "")).split()


def normalize_scheme_name(name: str) -> str:
    return " ".join(_norm(name))


ALIASES = {
    "pm kisan": "pm kisan",
    "pradhan mantri kisan samman nidhi": "pm kisan",
    "pradhan mantri kisan samman nidhi pm kisan": "pm kisan",
    "pmjay ayushman bharat": "pmjay",
    "pradhan mantri jan arogya yojana pmjay": "pmjay",
    "pradhan mantri jan arogya yojana ayushman bharat": "pmjay",
    "pmsby": "pmsby",
    "pradhan mantri suraksha bima yojana pmsby": "pmsby",
    "atal pension yojana": "atal pension yojana",
    "atal pension yojana apy": "atal pension yojana",
    "pmay": "pmay",
    "national scholarship portal nsp": "national scholarship portal",
    "rythu bandhu": "rythu bandhu",
    "rythu bima": "rythu bima",
    "kalyana lakshmi": "kalyana lakshmi",
    "ysr aarogyasri": "ysr aarogyasri",
    "ysr rythu bharosa": "ysr rythu bharosa",
    "kalaignar magalir urimai thogai": "kalaignar magalir urimai thogai",
    "gruha lakshmi": "gruha lakshmi",
    "gruha jyothi": "gruha jyothi",
    "majhi ladki bahin": "majhi ladki bahin",
    "mjpjay": "mjpjay",
    "lakshmir bhandar": "lakshmir bhandar",
    "swasthya sathi": "swasthya sathi",
    "chiranjeevi yojana": "chiranjeevi yojana",
    "mukhyamantri amrutum": "mukhyamantri amrutum",
    "karunya arogya suraksha": "karunya arogya suraksha",
    "ladli behna": "ladli behna",
    "kanya sumangala": "kanya sumangala",
    "kanya utthan": "kanya utthan",
    "orunodoi": "orunodoi",
    "himcare": "himcare",
    "pm ujjwala yojana": "pm ujjwala yojana",
    "sukanya samriddhi yojana": "sukanya samriddhi yojana",
    "national old age pension": "national old age pension",
    "pm shram yogi maandhan": "pm shram yogi maandhan",
}

OFFICIAL_URLS: Dict[str, str] = {
    # Central
    "pm kisan": "https://pmkisan.gov.in/",
    "pmjay": "https://pmjay.gov.in/",
    "pmsby": "https://jansuraksha.gov.in/",
    "atal pension yojana": "https://www.npscra.nsdl.co.in/scheme-details.php",
    "pmay": "https://pmaymis.gov.in/",
    "national scholarship portal": "https://scholarships.gov.in/",
    "pm ujjwala yojana": "https://www.pmuy.gov.in/",
    "sukanya samriddhi yojana": "https://www.indiapost.gov.in/",
    "national old age pension": "https://nsap.nic.in/",
    "pm shram yogi maandhan": "https://maandhan.in/",
    # State (official/state portals)
    "rythu bandhu": "https://www.rythubandhu.telangana.gov.in/",
    "rythu bima": "https://www.rythubima.telangana.gov.in/",
    "kalyana lakshmi": "https://telanganaepass.cgg.gov.in/",
    "ysr aarogyasri": "https://www.ysraarogyasri.ap.gov.in/",
    "ysr rythu bharosa": "https://ysrrythubharosa.ap.gov.in/",
    "kalaignar magalir urimai thogai": "https://www.tn.gov.in/",
    "gruha lakshmi": "https://sevasindhu.karnataka.gov.in/",
    "gruha jyothi": "https://sevasindhu.karnataka.gov.in/",
    "majhi ladki bahin": "https://www.maharashtra.gov.in/",
    "mjpjay": "https://www.jeevandayee.gov.in/",
    "lakshmir bhandar": "https://socialsecurity.wb.gov.in/",
    "swasthya sathi": "https://swasthyasathi.gov.in/",
    "chiranjeevi yojana": "https://chiranjeevi.rajasthan.gov.in/",
    "mukhyamantri amrutum": "https://www.magujarat.com/",
    "karunya arogya suraksha": "https://sha.kerala.gov.in/",
    "ladli behna": "https://cmladlibahna.mp.gov.in/",
    "kanya sumangala": "https://mksy.up.gov.in/",
    "kanya utthan": "https://medhasoft.bih.nic.in/",
    "orunodoi": "https://assam.gov.in/",
    "himcare": "https://www.hpsbys.in/",
}


SCHEME_RULES: Dict[str, Dict[str, Any]] = {
    # Central
    "pm kisan": {
        "occupation": "Farmer",
        "land_ownership": True,
        "indian_citizen": True,
        "not_income_tax_payer": True,
        "institutional_landholder": False,
    },
    "pmjay": {
        "bpl_status": True,
        "included_in_secc_2011": True,
        "indian_citizen": True,
        "no_family_size_limit": True,
    },
    "pmsby": {
        "min_age": 18,
        "max_age": 70,
        "bank_account": True,
        "indian_citizen": True,
    },
    "atal pension yojana": {
        "min_age": 18,
        "max_age": 40,
        "bank_account": True,
        "indian_citizen": True,
        "not_income_tax_payer": True,
    },
    "pmay": {
        "income_limit": 1800000,
        "no_pucca_house": True,
        "indian_citizen": True,
        "first_time_home_buyer": True,
    },
    "national scholarship portal": {
        "student_status": True,
        "enrolled_in_recognized_institution": True,
        "indian_citizen": True,
    },
    # State
    "rythu bandhu": {
        "state": "Telangana",
        "occupation": "Farmer",
        "land_ownership": True,
    },
    "rythu bima": {
        "state": "Telangana",
        "occupation": "Farmer",
        "min_age": 18,
        "max_age": 59,
    },
    "kalyana lakshmi": {
        "state": "Telangana",
        "gender": "Female",
        "min_age": 18,
        "caste_in": ["SC", "ST", "BC", "EBC"],
        "income_limit": 200000,
    },
    "ysr aarogyasri": {
        "state": "Andhra Pradesh",
        "bpl_status": True,
        "ration_card_type_in": ["White", "White Card"],
    },
    "ysr rythu bharosa": {
        "state": "Andhra Pradesh",
        "occupation": "Farmer",
        "land_ownership": True,
    },
    "kalaignar magalir urimai thogai": {
        "state": "Tamil Nadu",
        "gender": "Female",
        "head_of_family": True,
        "not_government_employee": True,
    },
    "gruha lakshmi": {
        "state": "Karnataka",
        "gender": "Female",
        "head_of_family": True,
        "ration_card_holder": True,
    },
    "gruha jyothi": {
        "state": "Karnataka",
        "electricity_connection": True,
    },
    "majhi ladki bahin": {
        "state": "Maharashtra",
        "gender": "Female",
        "min_age": 21,
    },
    "mjpjay": {
        "state": "Maharashtra",
        "ration_card_type_in": ["Yellow", "Orange", "Yellow Card", "Orange Card"],
    },
    "lakshmir bhandar": {
        "state": "West Bengal",
        "gender": "Female",
        "min_age": 25,
        "max_age": 60,
    },
    "swasthya sathi": {
        "state": "West Bengal",
        "resident": True,
    },
    "chiranjeevi yojana": {
        "state": "Rajasthan",
        "resident": True,
    },
    "mukhyamantri amrutum": {
        "state": "Gujarat",
        "bpl_status": True,
    },
    "karunya arogya suraksha": {
        "state": "Kerala",
        "bpl_status": True,
    },
    "ladli behna": {
        "state": "Madhya Pradesh",
        "gender": "Female",
        "min_age": 21,
    },
    "kanya sumangala": {
        "state": "Uttar Pradesh",
        "gender": "Female",
        "maximum_two_girl_children": True,
    },
    "kanya utthan": {
        "state": "Bihar",
        "gender": "Female",
        "education_completed": True,
    },
    "orunodoi": {
        "state": "Assam",
        "female_head_of_family": True,
    },
    "himcare": {
        "state": "Himachal Pradesh",
        "resident": True,
    },
    # Missing major schemes
    "pm ujjwala yojana": {
        "gender": "Female",
        "bpl_status": True,
        "no_lpg_connection": True,
    },
    "sukanya samriddhi yojana": {
        "gender": "Female",
        "max_age": 10,
        "indian_citizen": True,
    },
    "national old age pension": {
        "min_age": 60,
        "bpl_status": True,
    },
    "pm shram yogi maandhan": {
        "min_age": 18,
        "max_age": 40,
        "informal_worker": True,
        "monthly_income_max": 15000,
    },
}


def get_rule_for_scheme(scheme_name: str) -> Optional[Dict[str, Any]]:
    norm = normalize_scheme_name(scheme_name)
    key = ALIASES.get(norm, norm)
    return SCHEME_RULES.get(key)


def get_official_url_for_scheme(scheme_name: str) -> str:
    norm = normalize_scheme_name(scheme_name)
    key = ALIASES.get(norm, norm)
    return OFFICIAL_URLS.get(key, "")
