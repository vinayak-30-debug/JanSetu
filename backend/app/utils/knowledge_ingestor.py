import json
import os
import asyncio
from typing import List, Dict, Any
from .llm_client import llm_client
from ..policies.models import Policy
from .rag_retriever import rag_retriever

class KnowledgeIngestor:
    def __init__(self, raw_dir: str = "backend/data/raw_policies", 
                 target_file: str = "backend/data/policies.json"):
        self.raw_dir = raw_dir
        self.target_file = target_file

    async def ingest_new_files(self):
        """
        Polls the raw directory and processes any new text files.
        """
        if not os.path.exists(self.raw_dir):
            os.makedirs(self.raw_dir)
            
        files = [f for f in os.listdir(self.raw_dir) if f.endswith(('.txt', '.md'))]
        if not files:
            print("No new raw files found.")
            return

        new_policies = []
        for file_name in files:
            file_path = os.path.join(self.raw_dir, file_name)
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            print(f"Analyzing {file_name}...")
            policy_data = await self._analyze_content(content)
            if policy_data:
                new_policies.append(policy_data)
                # Move file to processed or delete? For MVP, let's keep it.

        if new_policies:
            self._update_policies_json(new_policies)
            # Re-initialize RAG index
            await rag_retriever._build_index()
            print(f"Successfully ingested {len(new_policies)} new policies.")

    async def _analyze_content(self, content: str) -> Optional[Dict[str, Any]]:
        prompt = f"""
        Analyze the following text about a government welfare scheme and extract the details in a structured JSON format suitable for our database.
        
        Text:
        {content}
        
        JSON Format Required:
        {{
            "policy_id": "UNIQUE_ID",
            "name": "Scheme Name",
            "description": "Short description",
            "ministry": "Ministry Name",
            "category": "Healthcare/Agriculture/etc.",
            "benefits": {{ "amount": 0, "frequency": "annual/one-time" }},
            "eligibility_criteria": {{
                "min_age": 0,
                "max_age": 100,
                "income_limit": 500000,
                "required_occupations": ["farmer/student/etc"],
                "required_states": ["all"],
                "required_documents": ["Doc1", "Doc2"]
            }},
            "application_process": ["Step 1", "Step 2"],
            "official_url": "URL"
        }}
        
        Return ONLY valid JSON.
        """
        response_text = await llm_client.generate_text(prompt)
        try:
            # Basic cleanup of LLM response
            json_str = response_text.strip()
            if json_str.startswith("```json"):
                json_str = json_str[7:-3]
            return json.loads(json_str)
        except Exception as e:
            print(f"Error parsing LLM response: {e}")
            return None

    def _update_policies_json(self, new_data: List[Dict[str, Any]]):
        existing_data = []
        if os.path.exists(self.target_file):
            with open(self.target_file, "r") as f:
                existing_data = json.load(f)
        
        # Avoid duplicates by ID
        existing_ids = {p["policy_id"] for p in existing_data}
        for p in new_data:
            if p["policy_id"] not in existing_ids:
                existing_data.append(p)
        
        with open(self.target_file, "w") as f:
            json.dump(existing_data, f, indent=4)

# Usage example if run directly
if __name__ == "__main__":
    ingestor = KnowledgeIngestor()
    asyncio.run(ingestor.ingest_new_files())
