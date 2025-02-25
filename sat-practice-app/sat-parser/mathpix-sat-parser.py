import os
import re
import json
import logging
import base64
import requests
from pathlib import Path
import pandas as pd
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("mathpix_parser.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Load categories and subcategories data
def load_metadata():
    logger.info("Loading categories and subcategories data")
    categories_df = pd.read_csv("categories.csv")
    subcategories_df = pd.read_csv("subcategories.csv")
    
    # Create lookup dictionaries
    categories_dict = {}
    for _, row in categories_df.iterrows():
        categories_dict[row['name']] = {
            'id': row['id'],
            'subject_id': row['subject_id']
        }
    
    subcategories_dict = {}
    for _, row in subcategories_df.iterrows():
        subcategories_dict[row['name']] = {
            'id': row['id'],
            'category_id': row['category_id']
        }
    
    logger.info(f"Loaded {len(categories_dict)} categories and {len(subcategories_dict)} subcategories")
    return categories_dict, subcategories_dict

def process_pdf_with_mathpix(pdf_path, app_id, app_key):
    """
    Process a PDF using MathPix API and extract text with math expressions
    """
    logger.info(f"Processing PDF with MathPix: {pdf_path}")
    
    # Read the PDF file as binary
    with open(pdf_path, "rb") as f:
        pdf_data = f.read()
    
    # Encode the PDF data as base64
    pdf_base64 = base64.b64encode(pdf_data).decode()
    
    # Prepare the API request
    url = "https://api.mathpix.com/v3/pdf"
    headers = {
        "app_id": app_id,
        "app_key": app_key,
        "Content-type": "application/json"
    }
    data = {
        "pdf": "data:application/pdf;base64," + pdf_base64,
        "processing_options": {
            "conversion_formats": {
                "md": True,
                "html": True,
                "latex": True
            },
            "math_inline_delimiters": ["$", "$"],
            "math_display_delimiters": ["$$", "$$"]
        }
    }
    
    # Make the API request
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()  # Raise an exception for HTTP errors
        
        result = response.json()
        logger.info(f"MathPix API request successful, PDF ID: {result.get('pdf_id')}")
        
        # Return the PDF ID for status checking
        return result.get("pdf_id")
    except Exception as e:
        logger.error(f"Error in MathPix API request: {str(e)}")
        raise

def check_conversion_status(pdf_id, app_id, app_key):
    """
    Check the status of a PDF conversion job
    """
    url = f"https://api.mathpix.com/v3/pdf/{pdf_id}"
    headers = {
        "app_id": app_id,
        "app_key": app_key
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        result = response.json()
        logger.info(f"Conversion status: {result.get('status')}")
        
        return result
    except Exception as e:
        logger.error(f"Error checking conversion status: {str(e)}")
        raise

def get_conversion_result(pdf_id, app_id, app_key):
    """
    Get the result of a completed PDF conversion
    """
    url = f"https://api.mathpix.com/v3/pdf/{pdf_id}.md"
    headers = {
        "app_id": app_id,
        "app_key": app_key
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        result = response.text
        logger.info(f"Successfully retrieved conversion result")
        
        return result
    except Exception as e:
        logger.error(f"Error getting conversion result: {str(e)}")
        raise

def parse_mathpix_output(markdown_text, categories_dict, subcategories_dict, pdf_path):
    """
    Parse the Markdown output from MathPix and extract questions and options
    """
    logger.info("Parsing MathPix output")
    
    # Get metadata from file path
    parts = Path(pdf_path).parts
    subject_name = parts[-3]  # Math or Reading & Writing
    category_name = parts[-2]  # e.g., Advanced Math
    pdf_filename = parts[-1]   # e.g., "Equivalent Expressions 1~Key.pdf"
    
    # Extract subcategory name from filename
    subcategory_match = re.match(r"(.+?)\s+\d+~Key\.pdf", pdf_filename)
    subcategory_name = subcategory_match.group(1) if subcategory_match else "Unknown"
    
    # Get IDs from dictionaries
    subject_id = 1 if subject_name == "Math" else 4
    
    category_id = categories_dict.get(category_name, {}).get('id', 1)
    subcategory_id = subcategories_dict.get(subcategory_name, {}).get('id', 2)
    
    # Split the markdown text into question blocks
    # First, try to find Question ID patterns
    question_pattern = r"Question ID ([a-zA-Z0-9]+)|ID: ([a-zA-Z0-9]+)"
    question_blocks = re.split(question_pattern, markdown_text)
    
    questions = []
    options = []
    question_id_counter = 1
    option_id_counter = 1
    
    # Process each question block
    # The split produces: [text_before_first_match, id1, None, text_after_id1, id2, None, text_after_id2, ...]
    # Or: [text_before_first_match, None, id1, text_after_id1, None, id2, text_after_id2, ...]
    for i in range(1, len(question_blocks), 3):
        if i + 2 >= len(question_blocks):
            break
            
        # Get the question ID (could be in either group 1 or group 2)
        question_id = question_blocks[i] or question_blocks[i+1]
        if not question_id:
            continue
            
        question_text_block = question_blocks[i+2]
        logger.info(f"Processing question ID: {question_id}")
        
        # Extract difficulty
        difficulty_match = re.search(r'Question Difficulty:\s*(Easy|Medium|Hard)', question_text_block)
        difficulty = difficulty_match.group(1) if difficulty_match else "Medium"
        
        # Extract equation and question text
        # Look for lines before the options start
        lines = question_text_block.strip().split('\n')
        equation_text = ""
        question_text = ""
        
        # Find where options start
        options_start_idx = -1
        for idx, line in enumerate(lines):
            if re.match(r'^[A-D]\.', line.strip()):
                options_start_idx = idx
                break
        
        # Extract text before options
        if options_start_idx > 0:
            before_options = lines[:options_start_idx]
            
            # First line with math is likely the equation
            for line in before_options:
                if '$' in line:  # MathPix should have formatted math with $ delimiters
                    equation_text = line.strip()
                    break
            
            # Look for "Which of the following" question text
            question_pattern = r'Which of the following.*?\?'
            for line in before_options:
                if re.search(question_pattern, line):
                    question_text = line.strip()
                    break
        
        # If we couldn't find question text, use a default
        if not question_text and options_start_idx > 0:
            question_text = ' '.join(lines[:options_start_idx]).strip()
        
        # Combine equation and question text
        full_question_text = ""
        if equation_text:
            full_question_text += f"{equation_text}\n"
        if question_text:
            full_question_text += question_text
        
        # Extract correct answer
        correct_answer_match = re.search(r'Correct Answer:\s*([A-D])', question_text_block)
        correct_answer = correct_answer_match.group(1) if correct_answer_match else None
        
        # Extract options
        option_matches = re.finditer(r'([A-D])\.\s+(.+?)(?=\n[A-D]\.|Correct Answer:|Rationale|$)', 
                                    question_text_block, re.DOTALL)
        option_values = []
        
        for match in option_matches:
            option_letter = match.group(1)
            option_text = match.group(2).strip()
            is_correct = (option_letter == correct_answer)
            
            option_values.append({
                "id": option_id_counter,
                "question_id": question_id_counter,
                "value": option_letter,
                "label": option_text,
                "is_correct": is_correct
            })
            option_id_counter += 1
        
        # Create the question entry
        if full_question_text:
            current_question = {
                "id": question_id_counter,
                "question_text": full_question_text,
                "image_url": None,
                "difficulty": difficulty,
                "subject_id": subject_id,
                "subject": subject_name,
                "category_id": category_id,
                "category": category_name,
                "subcategory_id": subcategory_id,
                "subcategory": subcategory_name
            }
            
            questions.append(current_question)
            options.extend(option_values)
            question_id_counter += 1
    
    logger.info(f"Extracted {len(questions)} questions and {len(options)} options")
    return questions, options

def process_single_pdf(pdf_path, app_id, app_key):
    """
    Process a single PDF with MathPix and generate question and option JSON files
    """
    # Load metadata
    categories_dict, subcategories_dict = load_metadata()
    
    try:
        # Submit PDF to MathPix
        pdf_id = process_pdf_with_mathpix(pdf_path, app_id, app_key)
        
        # Wait for conversion to complete (in a real scenario, you'd implement polling)
        status = check_conversion_status(pdf_id, app_id, app_key)
        while status.get('status') not in ['completed', 'error']:
            logger.info("Waiting for conversion to complete...")
            import time
            time.sleep(5)  # Wait 5 seconds before checking again
            status = check_conversion_status(pdf_id, app_id, app_key)
        
        if status.get('status') == 'error':
            logger.error(f"Conversion failed: {status.get('error')}")
            return
        
        # Get the conversion result
        markdown_text = get_conversion_result(pdf_id, app_id, app_key)
        
        # Save the raw output for debugging
        with open("mathpix_raw_output.md", "w", encoding="utf-8") as f:
            f.write(markdown_text)
        
        # Parse the output
        questions, options = parse_mathpix_output(markdown_text, categories_dict, subcategories_dict, pdf_path)
        
        # Save results to JSON
        with open("questions.json", "w", encoding="utf-8") as f:
            json.dump(questions, f, indent=2)
        
        with open("options.json", "w", encoding="utf-8") as f:
            json.dump(options, f, indent=2)
        
        logger.info(f"Processing complete. Results saved to questions.json and options.json")
        
    except Exception as e:
        logger.error(f"Error processing PDF: {str(e)}")

if __name__ == "__main__":
    # Replace with your MathPix credentials
    APP_ID = "YOUR_MATHPIX_APP_ID"
    APP_KEY = "YOUR_MATHPIX_APP_KEY"
    
    # Path to the PDF file
    pdf_path = "sat-question-bank/Math/Advanced Math/Nonlinear Equations and Systems 1~Key.pdf"
    
    # Process the PDF
    process_single_pdf(pdf_path, APP_ID, APP_KEY)
