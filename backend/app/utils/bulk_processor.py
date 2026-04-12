import json
import os
import asyncio
import re
from pypdf import PdfReader
from typing import List, Dict, Any, Optional
from backend.app.utils.llm_client import llm_client

class KnowledgeProcessor:
    def __init__(self, base_dir: str = "backend/data/knowledge_base"):
        self.base_dir = base_dir
        self.central_dir = os.path.join(base_dir, "central")
        self.states_dir = os.path.join(base_dir, "states")
        self.ensure_dirs()

    def ensure_dirs(self):
        os.makedirs(self.central_dir, exist_ok=True)
        os.makedirs(self.states_dir, exist_ok=True)

    def process_json_dataset(self, json_path: str):
        if not os.path.exists(json_path):
            print(f"JSON dataset not found: {json_path}")
            return
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        print(f"Found {len(data.get('central_schemes', []))} central schemes and {len(data.get('state_schemes', {}))} states in JSON.")
            
        # Process Central
        for scheme in data.get("central_schemes", []):
            self.save_policy(scheme, "central")
            
        # Process States
        for state, schemes in data.get("state_schemes", {}).items():
            for scheme in schemes:
                self.save_policy(scheme, "states", state)

    def save_policy(self, data: Dict[str, Any], group: str, state: Optional[str] = None):
        if group == "central":
            target_dir = self.central_dir
        else:
            state_dir = os.path.join(self.states_dir, state or "General")
            os.makedirs(state_dir, exist_ok=True)
            target_dir = state_dir
            
        name = data.get("scheme_name", data.get("name", "unknown_scheme"))
        file_name = f"{name.replace(' ', '_').lower()}.json"
        # Sanitize filename
        file_name = re.sub(r'[^\w\-.]', '_', file_name)
        file_path = os.path.join(target_dir, file_name)
        
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)

    async def _analyze_content(self, content: str) -> Optional[List[Dict[str, Any]]]:
        # Cleanup content for prompt
        clean_content = content.replace("\n", " ")[:6000]
        
        prompt = f"""
        Analyze the following government scheme document and extract scheme details.
        Extraction should be a list of JSON objects if multiple schemes are found.
        
        Text:
        {clean_content}
        
        JSON Structure per scheme:
        {{
            "scheme_name": "Exact Name",
            "category": "Health/Farmer/Scholarship/etc.",
            "benefit": "Specific benefits mentioned",
            "eligibility": ["Criteria 1", "Criteria 2"]
        }}
        
        Respond ALWAYS as a JSON LIST of objects. Example: [{{ ... }}, {{ ... }}].
        Respond ONLY with the JSON list. No other text.
        """
        response_text = await llm_client.generate_text(prompt)
        print(f"DEBUG: LLM raw response starts: {response_text[:100]}...")
        
        try:
            # Find the first [ and last ] to isolate JSON
            start = response_text.find('[')
            end = response_text.rfind(']')
            if start != -1 and end != -1:
                json_str = response_text[start:end+1]
                data = json.loads(json_str)
                if isinstance(data, list):
                    return data
                elif isinstance(data, dict):
                    return [data]
            
            # Fallback to search for { }
            start = response_text.find('{')
            end = response_text.rfind('}')
            if start != -1 and end != -1:
                json_str = response_text[start:end+1]
                data = json.loads(json_str)
                if isinstance(data, dict):
                    return [data]
            return None
        except Exception as e:
            print(f"Error parsing LLM JSON: {e}")
            return None

    async def process_pdf(self, pdf_path: str, is_central: bool = True, state: Optional[str] = None):
        if not os.path.exists(pdf_path):
            print(f"File not found: {pdf_path}")
            return
            
        try:
            reader = PdfReader(pdf_path)
            all_text = ""
            # Extract first 10 pages for multi-scheme PDFs 
            for page in reader.pages[:10]:
                all_text += page.extract_text() + "\n"
            
            print(f"Extracted {len(all_text)} chars from {os.path.basename(pdf_path)}")
            schemes_data = await self._analyze_content(all_text)
            if schemes_data:
                for scheme in schemes_data:
                    self.save_policy(scheme, "central" if is_central else "states", state)
                print(f"DONE: Processed {len(schemes_data)} schemes from {os.path.basename(pdf_path)}")
            else:
                print(f"FAIL: Could not extract logic from {os.path.basename(pdf_path)}")
        except Exception as e:
            print(f"Error processing {pdf_path}: {e}")

async def main():
    processor = KnowledgeProcessor()
    
    # 1. Process the big JSON dataset
    json_dataset = r"c:\Users\palar\Downloads\BBN_MongoDB_Ready_Schemes_Dataset.json"
    processor.process_json_dataset(json_dataset)
    
    # 2. Process specific PDFs
    pdfs = [
        (r"c:\Users\palar\Downloads\BBN_All_Schemes_Central_Included.pdf", True, None),
        (r"c:\Users\palar\Downloads\BBN_Filtered_Farmer_Women_Health_Schemes.pdf", True, None)
    ]
    
    for path, is_central, state in pdfs:
        await processor.process_pdf(path, is_central, state)
        # Small delay to avoid rate limiting
        await asyncio.sleep(2)

if __name__ == "__main__":
    asyncio.run(main())
