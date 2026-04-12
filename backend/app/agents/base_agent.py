from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from ..policies.models import UserProfile

class BaseAgent(ABC):
    def __init__(self, agent_id: str, agent_type: str):
        self.agent_id = agent_id
        self.agent_type = agent_type

    @abstractmethod
    async def execute(self, query: str, context: Optional[Dict[str, Any]] = None, profile: Optional[UserProfile] = None) -> Dict[str, Any]:
        pass

    def validate_input(self, query: str) -> bool:
        return len(query.strip()) > 0
