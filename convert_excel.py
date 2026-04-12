import pandas as pd
import json
import os

def convert_excel_to_json(excel_path, json_path):
    try:
        # Check if file exists
        if not os.path.exists(excel_path):
            print(f"Error: File {excel_path} not found.")
            return False
            
        # Read the Excel file
        df = pd.read_excel(excel_path)
        # Convert NaNs to None for valid JSON output (null)
        df = df.where(pd.notnull(df), None)
        # Convert to dictionary (list of records)
        records = df.to_dict(orient='records')
        
        print(f"Total records read: {len(records)}")
        
        # Write to JSON
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(records, f, indent=4, ensure_ascii=False)
            
        print(f"Successfully converted to {json_path}")
        return True
    except Exception as e:
        print(f"Error during conversion: {e}")
        return False

if __name__ == "__main__":
    excel_file = r"c:\Users\palar\Downloads\bbn_india_synthetic_citizens.xlsx"
    json_file = r"c:\Users\palar\OneDrive\Documents\klhackthon\backend\data\citizens.json"
    convert_excel_to_json(excel_file, json_file)
