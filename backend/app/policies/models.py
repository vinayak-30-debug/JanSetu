from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

class UserProfile(BaseModel):
    user_id: str
    aadhaar_no: Optional[str] = None
    name: str = ""
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    income: Optional[float] = None
    monthly_income: Optional[float] = None
    annual_income: Optional[float] = None
    occupation: Optional[str] = None
    state: Optional[str] = None
    caste: Optional[str] = None
    residency_type: Optional[str] = None # Urban/Rural
    ration_card: bool = False
    ration_card_type: Optional[str] = None
    bpl_status: bool = False
    disability_status: bool = False
    senior_citizen: bool = False
    gender: Optional[str] = None
    land_ownership: Optional[bool] = None
    bank_account: Optional[bool] = None
    student_status: Optional[bool] = None
    indian_citizen: bool = True
    income_tax_payer: Optional[bool] = None
    institutional_landholder: Optional[bool] = None
    included_in_secc_2011: Optional[bool] = None
    no_family_size_limit: Optional[bool] = None
    no_pucca_house: Optional[bool] = None
    first_time_home_buyer: Optional[bool] = None
    enrolled_in_recognized_institution: Optional[bool] = None
    head_of_family: Optional[bool] = None
    government_employee: Optional[bool] = None
    ration_card_holder: Optional[bool] = None
    electricity_connection: Optional[bool] = None
    household_consumption_limit: Optional[float] = None
    resident: Optional[bool] = None
    family_income: Optional[float] = None
    maximum_two_girl_children: Optional[bool] = None
    education_completed: Optional[bool] = None
    female_head_of_family: Optional[bool] = None
    informal_worker: Optional[bool] = None
    no_lpg_connection: Optional[bool] = None
    enrolled_schemes: List[str] = []
    uploaded_documents: List[str] = []
    is_complete: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class EligibilityCriteria(BaseModel):
    model_config = ConfigDict(extra="allow")

    min_age: Optional[int] = 0
    max_age: Optional[int] = 100
    # Use a large finite default to avoid JSON serialization errors with Infinity.
    income_limit: Optional[float] = 1_000_000_000.0
    required_occupations: List[str] = ["any"]
    required_states: List[str] = ["all"]
    required_documents: List[str] = []

class Policy(BaseModel):
    policy_id: str
    name: str
    description: str
    ministry: str
    category: str
    benefits: Dict[str, Any]
    eligibility_criteria: EligibilityCriteria
    application_process: List[str]
    deadline: Optional[str] = None
    official_url: Optional[str] = None
    llm_summary: Optional[str] = None

class EligibilityResult(BaseModel):
    policy_id: str
    policy_name: str
    is_eligible: bool
    match_score: float
    reason: str
    matched_criteria: List[str] = []
    missing_criteria: List[str] = []
