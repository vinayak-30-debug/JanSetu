from enum import Enum
from typing import Dict, Any
from ..policies.models import UserProfile

class UserPathway(str, Enum):
    DIRECT = "DIRECT"
    ASSISTED = "ASSISTED"
    ACCESSIBILITY = "ACCESSIBILITY"

class PathwayDetector:
    @staticmethod
    def detect_pathway(profile: UserProfile) -> Dict[str, Any]:
        """
        Dynamically detects the inclusive interaction pathway based on citizen profile.
        """
        pathway = UserPathway.DIRECT
        reasons = []

        # 1. Check for Accessibility Needs
        if profile.disability_status:
            pathway = UserPathway.ACCESSIBILITY
            reasons.append("Disability status detected")

        # 2. Check for Assisted Mode Requirements (Illiteracy/Senior)
        elif profile.senior_citizen or (profile.age and profile.age > 65):
            pathway = UserPathway.ASSISTED
            reasons.append("Senior citizen threshold reached")
        
        # Checking for low education level (mocking the check since we added the field to JSON earlier)
        # Note: We'd need to ensure 'education_level' is in the profile model or handled as extra
        
        # 3. Handle specific 'Assisted' flags
        # If the user has zero uploaded docs, they likely need assistance
        if not profile.uploaded_documents:
            pathway = UserPathway.ASSISTED
            reasons.append("No documents available; high friction detected")

        return {
            "pathway": pathway,
            "reasons": reasons,
            "ui_indicators": {
                "show_icons": pathway != UserPathway.DIRECT,
                "simplified_language": pathway == UserPathway.ASSISTED,
                "high_contrast": pathway == UserPathway.ACCESSIBILITY,
                "voice_enabled": pathway == UserPathway.ACCESSIBILITY
            }
        }
