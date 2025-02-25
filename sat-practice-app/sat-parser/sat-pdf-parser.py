import os
import re
import json
import logging
from pathlib import Path
import fitz  # PyMuPDF
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

# Format math expressions with appropriate $ or $$ wrapping
def format_math_expressions(text):
    if not text:
        return text
    
    # Check if the text is a math expression that needs wrapping
    math_chars = ['=', '<', '>', '+', '-', '*', '/', '^', '(', ')', '[', ']', '|']
    has_math_chars = any(char in text for char in math_chars)
    has_variables = bool(re.search(r'\b[a-zA-Z]\b', text))  # Single letters that are likely variables
    
    # If it looks like a math expression, wrap in $ signs
    if has_math_chars and has_variables:
        # Check if it's already wrapped
        if not (text.startswith('$') and text.endswith('$')):
            # For standalone equations, use double $$ for block display
            if '\n' not in text and not text.endswith('.') and not text.endswith('?'):
                return f"$${text}$$"
            # For inline math, use single $
            return f"${text}$"
    
    return text

# Function to extract question data from PDF using PyMuPDF
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
        # Open PDF with PyMuPDF
        doc = fitz.open(pdf_path)
        full_text = ""
        
        # First, extract all text from the PDF with better formatting
        for page_num in range(len(doc)):
            page = doc[page_num]
            # Extract text with better handling of text blocks
            page_text = page.get_text("text")
            if page_text:
                full_text += page_text + "\n"
        
        # Split the text by "Question ID" pattern to identify individual questions
        question_pattern = r"Question ID ([a-zA-Z0-9]+)"
        question_matches = list(re.finditer(question_pattern, full_text))
        
        # If the pattern didn't work, try an alternative
        if not question_matches:
            question_pattern = r"ID:\s+([a-zA-Z0-9]+)"
            question_matches = list(re.finditer(question_pattern, full_text))
        
        question_id_counter = 1
        option_id_counter = 1
        
        # Process each question block by finding boundaries
        for i in range(len(question_matches)):
            start_pos = question_matches[i].start()
            end_pos = question_matches[i+1].start() if i+1 < len(question_matches) else len(full_text)
            
            question_block = full_text[start_pos:end_pos]
            question_id_match = re.search(r"(?:Question ID|ID:)\s+([a-zA-Z0-9]+)", question_block)
            question_id = question_id_match.group(1) if question_id_match else f"unknown_{question_id_counter}"
            
            logger.info(f"Processing question ID: {question_id}")
            
            # Extract difficulty
            difficulty_match = re.search(r'Question Difficulty:\s*(Easy|Medium|Hard)', question_block)
            difficulty = difficulty_match.group(1) if difficulty_match else "Medium"
            
            # Extract equation/inequality
            # First, find where the question ID line ends
            id_line_end = re.search(r"(?:Question ID|ID:)[^\n]+\n", question_block)
            if id_line_end:
                content_start = id_line_end.end()
                content = question_block[content_start:]
                
                # Extract the equation and question text
                lines = content.strip().split('\n')
                equation_text = ""
                
                # First non-empty line after ID is often the equation
                for line in lines:
                    line = line.strip()
                    if line and not line.startswith('A.') and not line.startswith('B.') and not line.startswith('C.') and not line.startswith('D.'):
                        # Check if it looks like an equation/inequality
                        if any(c in line for c in ['<', '>', '=', '+', '-', '*', '/']):
                            equation_text = line
                            break
                
                # Find the "Which of the following" question text
                question_match = re.search(r'Which of the following[^?]+\?', content)
                question_text = ""
                
                if question_match:
                    question_text = question_match.group(0).strip()
                
                # Combine equation and question text
                full_question_text = ""
                if equation_text:
                    # Format equation with double dollar signs
                    full_question_text += f"$${equation_text}$$\n"
                if question_text:
                    full_question_text += question_text
                
                # Extract the correct answer
                correct_answer_match = re.search(r'Correct Answer:\s*([A-D])', question_block)
                correct_answer = correct_answer_match.group(1) if correct_answer_match else None
                
                # Extract options (A, B, C, D)
                option_labels = []
                
                for opt in ['A', 'B', 'C', 'D']:
                    # Look for patterns like "A. x - y > 2" or "B. 2x - 3y > 4"
                    opt_pattern = rf'{opt}\.\s+(.*?)(?=(?:[A-D]\.|Correct Answer:|Rationale|$))'
                    opt_match = re.search(opt_pattern, content, re.DOTALL)
                    
                    if opt_match:
                        # Clean up option text
                        opt_text = opt_match.group(1).strip()
                        # Remove line breaks and normalize whitespace
                        opt_text = re.sub(r'\s+', ' ', opt_text).strip()
                        # Format math expressions
                        opt_text = format_math_expressions(opt_text)
                        option_labels.append((opt, opt_text))
                    else:
                        logger.warning(f"Could not find option {opt} for question {question_id}")
                        option_labels.append((opt, f"Option {opt} text not found"))
                
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
                    
                    # Create option entries
                    for opt_value, opt_label in option_labels:
                        is_correct = (correct_answer and opt_value == correct_answer)
                        
                        options.append({
                            "id": option_id_counter,
                            "question_id": question_id_counter,
                            "value": opt_value,
                            "label": opt_label,
                            "is_correct": is_correct
                        })
                        option_id_counter += 1
                    
                    question_id_counter += 1
        
        # Close the document
        doc.close()
            
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