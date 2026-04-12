try:
    import google.generativeai as genai
except Exception:
    genai = None
from ..config import get_settings
from typing import Optional, List, Dict, Any

settings = get_settings()

class LLMClient:
    def __init__(self):
        self.llm_mode = (settings.LLM_MODE or "auto").strip().lower()
        if self.llm_mode == "offline":
            self.model = None
        elif settings.GEMINI_API_KEY and genai is not None:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel('gemini-2.5-flash')
        else:
            self.model = None

    async def generate_text(self, prompt: str) -> str:
        if self.llm_mode == "offline":
            return (
                "Offline mode response: local fallback is active. "
                "Rule-based processing can continue without internet."
            )
        if not self.model:
            return "LLM API Key not configured. Please provide a mock response."
        
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error generating text: {str(e)}"

    async def detect_intent(self, query: str) -> Dict[str, Any]:
        """
        Simplistic intent detection using Gemini.
        """
        prompt = f"""
        Analyze the following user query for a welfare scheme platform:
        Query: "{query}"
        
        Extract the following in JSON format:
        - intent: (eligibility / explanation / claim / search / chat)
        - entities: (scheme name, occupation, income level, state if mentioned)
        - confidence: (0.0 to 1.0)
        
        Return ONLY valid JSON.
        """
        response_text = await self.generate_text(prompt)
        # In a real app, we'd parse the JSON properly.
        return {"raw_response": response_text}

llm_client = LLMClient()
