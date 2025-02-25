import os
import re
import json
import logging
from pathlib import Path
import PyPDF2
import pandas as pd
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("pdf_parser.log"),
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

# Function to format math expressions
def format_math_expressions(text):
    if not text:
        return text
    
    # Format inline math expressions (within sentences)
    # This is a simplistic approach; might need refinement for complex expressions
    inline_pattern = r'(\$[^$]+\$)'
    block_pattern = r'(\$\$[^$]+\$\$)'
    
    # Format any math that's not already wrapped in $ or $$
    # This would need more sophisticated logic in a real implementation
    math_symbols_pattern = r'([=<>±×÷≠≈≤≥√∑∏∫]|(\d+\/\d+))'
    
    # For now, just return the text - you would implement more sophisticated
    # math formatting based on your actual PDF content patterns
    return text

# Function to extract question data from PDF
def extract_questions_from_pdf(pdf_path, categories_dict, subcategories_dict, stats):
    logger.info(f"Processing PDF: {pdf_path}")
    
    # Get metadata from file path
    parts = pdf_path.parts
    subject_name = parts[-3]  # Math or Reading & Writing
    category_name = parts[-2]  # e.g., Advanced Math
    pdf_filename = parts[-1]   # e.g., "Equivalent Expressions 1~Key.pdf"
    
    pdf_stats = {
        "pdf_path": str(pdf_path),
        "subject": subject_name,
        "category": category_name,
        "filename": pdf_filename,
        "status": "processing",
        "questions_extracted": 0,
        "options_extracted": 0,
        "errors": [],
        "processing_time_ms": 0
    }
    
    start_time = datetime.now()
    
    # Extract subcategory name from filename
    subcategory_match = re.match(r"(.+?)\s+\d+~Key\.pdf", pdf_filename)
    if not subcategory_match:
        error_msg = f"Could not extract subcategory from filename: {pdf_filename}"
        logger.warning(error_msg)
        pdf_stats["status"] = "error"
        pdf_stats["errors"].append(error_msg)
        stats["pdfs"].append(pdf_stats)
        return [], []
    
    subcategory_name = subcategory_match.group(1)
    pdf_stats["subcategory"] = subcategory_name
    
    # Get IDs from dictionaries
    subject_id = 1 if subject_name == "Math" else 4  # Based on your data
    
    if category_name not in categories_dict:
        error_msg = f"Category not found: {category_name}"
        logger.warning(error_msg)
        pdf_stats["status"] = "error"
        pdf_stats["errors"].append(error_msg)
        stats["pdfs"].append(pdf_stats)
        return [], []
    
    category_id = categories_dict[category_name]['id']
    
    if subcategory_name not in subcategories_dict:
        error_msg = f"Subcategory not found: {subcategory_name}"
        logger.warning(error_msg)
        pdf_stats["status"] = "error"
        pdf_stats["errors"].append(error_msg)
        stats["pdfs"].append(pdf_stats)
        return [], []
    
    subcategory_id = subcategories_dict[subcategory_name]['id']
    
    # Open and read the PDF
    questions = []
    options = []
    
    try:
        pdf_reader = PyPDF2.PdfReader(pdf_path)
        current_question = None
        question_id_counter = 1
        option_id_counter = 1
        
        # For each page in the PDF
        for page_num, page in enumerate(pdf_reader.pages):
            text = page.extract_text()
            if not text:
                continue
            
            # Look for question ID pattern
            question_id_matches = re.finditer(r"ID:\s+([a-zA-Z0-9]+)\b", text)
            for match in question_id_matches:
                # If we found a new question ID and have processed a previous question
                if current_question:
                    questions.append(current_question)
                    
                question_id = match.group(1)
                logger.info(f"Found question ID: {question_id}")
                
                # Extract difficulty (this would depend on your PDF format)
                difficulty_match = re.search(r"Question Difficulty:\s+(Easy|Medium|Hard)", text[match.end():])
                difficulty = difficulty_match.group(1) if difficulty_match else "Medium"  # Default if not found
                
                # Extract question text (simplistic approach, would need refinement)
                question_text_match = re.search(r"Which of the following is equivalent to.*?\?", text[match.end():], re.DOTALL)
                question_text = question_text_match.group(0) if question_text_match else ""
                
                # Format math expressions in the question
                question_text = format_math_expressions(question_text)
                
                current_question = {
                    "id": question_id_counter,
                    "question_text": question_text,
                    "image_url": None,  # Would need image extraction logic
                    "difficulty": difficulty,
                    "subject_id": subject_id,
                    "subject": subject_name,
                    "category_id": category_id,
                    "category": category_name,
                    "subcategory_id": subcategory_id,
                    "subcategory": subcategory_name
                }
                
                # Extract options (A, B, C, D)
                option_matches = re.finditer(r"([A-D])\.\s+(.+?)(?=\n[A-D]\.|$)", text[match.end():], re.DOTALL)
                for option_match in option_matches:
                    option_value = option_match.group(1)  # A, B, C, D
                    option_label = option_match.group(2).strip()
                    
                    # Format math expressions in the option
                    option_label = format_math_expressions(option_label)
                    
                    # Determine if this is the correct answer
                    # This would need to be adjusted based on how correct answers are marked in your PDFs
                    is_correct_match = re.search(r"Correct Answer:\s+([A-D])", text)
                    is_correct = False
                    if is_correct_match and is_correct_match.group(1) == option_value:
                        is_correct = True
                    
                    options.append({
                        "id": option_id_counter,
                        "question_id": question_id_counter,
                        "value": option_value,
                        "label": option_label,
                        "is_correct": is_correct
                    })
                    option_id_counter += 1
                
                question_id_counter += 1
        
        # Add the last question if there is one
        if current_question:
            questions.append(current_question)
            
    except Exception as e:
        error_msg = f"Error processing PDF {pdf_path}: {str(e)}"
        logger.error(error_msg)
        pdf_stats["status"] = "error"
        pdf_stats["errors"].append(error_msg)
        stats["pdfs"].append(pdf_stats)
        return [], []
    
    # Update stats for this PDF
    end_time = datetime.now()
    processing_time = (end_time - start_time).total_seconds() * 1000  # convert to milliseconds
    
    pdf_stats["status"] = "success"
    pdf_stats["questions_extracted"] = len(questions)
    pdf_stats["options_extracted"] = len(options)
    pdf_stats["processing_time_ms"] = processing_time
    
    stats["pdfs"].append(pdf_stats)
    stats["total_questions"] += len(questions)
    stats["total_options"] += len(options)
    
    if subject_name not in stats["subjects"]:
        stats["subjects"][subject_name] = {
            "categories": {},
            "total_questions": 0,
            "total_options": 0,
            "total_pdfs": 0
        }
    
    stats["subjects"][subject_name]["total_questions"] += len(questions)
    stats["subjects"][subject_name]["total_options"] += len(options)
    stats["subjects"][subject_name]["total_pdfs"] += 1
    
    if category_name not in stats["subjects"][subject_name]["categories"]:
        stats["subjects"][subject_name]["categories"][category_name] = {
            "subcategories": {},
            "total_questions": 0,
            "total_options": 0,
            "total_pdfs": 0
        }
    
    stats["subjects"][subject_name]["categories"][category_name]["total_questions"] += len(questions)
    stats["subjects"][subject_name]["categories"][category_name]["total_options"] += len(options)
    stats["subjects"][subject_name]["categories"][category_name]["total_pdfs"] += 1
    
    if subcategory_name not in stats["subjects"][subject_name]["categories"][category_name]["subcategories"]:
        stats["subjects"][subject_name]["categories"][category_name]["subcategories"][subcategory_name] = {
            "total_questions": 0,
            "total_options": 0,
            "total_pdfs": 0,
            "pdf_files": []
        }
    
    stats["subjects"][subject_name]["categories"][category_name]["subcategories"][subcategory_name]["total_questions"] += len(questions)
    stats["subjects"][subject_name]["categories"][category_name]["subcategories"][subcategory_name]["total_options"] += len(options)
    stats["subjects"][subject_name]["categories"][category_name]["subcategories"][subcategory_name]["total_pdfs"] += 1
    stats["subjects"][subject_name]["categories"][category_name]["subcategories"][subcategory_name]["pdf_files"].append(pdf_filename)
    
    logger.info(f"Extracted {len(questions)} questions and {len(options)} options from {pdf_path}")
    return questions, options

# Main function to process all PDFs
def process_all_pdfs(base_dir="sat-question-bank"):
    logger.info(f"Starting to process PDFs in {base_dir}")
    
    # Initialize stats
    stats = {
        "start_time": datetime.now().isoformat(),
        "end_time": None,
        "total_pdfs_processed": 0,
        "total_pdfs_successful": 0,
        "total_pdfs_failed": 0,
        "total_questions": 0,
        "total_options": 0,
        "subjects": {},
        "pdfs": []
    }
    
    # Load metadata
    categories_dict, subcategories_dict = load_metadata()
    
    all_questions = []
    all_options = []
    
    # Walk through the directory structure
    for subject in ["Math", "Reading & Writing"]:
        subject_dir = Path(base_dir) / subject
        if not subject_dir.exists():
            logger.warning(f"Subject directory not found: {subject_dir}")
            continue
        
        logger.info(f"Processing subject: {subject}")
        
        for category_dir in subject_dir.iterdir():
            if not category_dir.is_dir():
                continue
            
            logger.info(f"Processing category: {category_dir.name}")
            
            # Find all PDFs in this category directory
            for pdf_file in category_dir.glob("*~Key.pdf"):
                stats["total_pdfs_processed"] += 1
                questions, options = extract_questions_from_pdf(pdf_file, categories_dict, subcategories_dict, stats)
                all_questions.extend(questions)
                all_options.extend(options)
    
    # Add subcategory summary to stats
    subcategory_summary = []
    for subject_name, subject_data in stats["subjects"].items():
        for category_name, category_data in subject_data["categories"].items():
            for subcategory_name, subcategory_data in category_data["subcategories"].items():
                subcategory_summary.append({
                    "subject": subject_name,
                    "category": category_name,
                    "subcategory": subcategory_name,
                    "total_pdfs": subcategory_data["total_pdfs"],
                    "total_questions": subcategory_data["total_questions"],
                    "total_options": subcategory_data["total_options"],
                    "pdf_files": subcategory_data["pdf_files"]
                })
    
    stats["subcategory_summary"] = subcategory_summary
    
    # Update final stats
    stats["end_time"] = datetime.now().isoformat()
    stats["total_pdfs_successful"] = len([p for p in stats["pdfs"] if p["status"] == "success"])
    stats["total_pdfs_failed"] = len([p for p in stats["pdfs"] if p["status"] == "error"])
    stats["processing_time_seconds"] = (datetime.fromisoformat(stats["end_time"]) - 
                                       datetime.fromisoformat(stats["start_time"])).total_seconds()
    
    # Save results to JSON
    with open("questions.json", "w") as f:
        json.dump(all_questions, f, indent=2)
    
    with open("options.json", "w") as f:
        json.dump(all_options, f, indent=2)
    
    with open("parser_stats.json", "w") as f:
        json.dump(stats, f, indent=2)
    
    logger.info(f"Processing complete. Total questions: {len(all_questions)}, Total options: {len(all_options)}")
    logger.info(f"Stats saved to parser_stats.json")
    
    return all_questions, all_options, stats

if __name__ == "__main__":
    process_all_pdfs()