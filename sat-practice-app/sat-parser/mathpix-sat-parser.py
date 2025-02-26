import re
import json
import logging
from pathlib import Path

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("md_parser.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def parse_markdown_file(markdown_file_path):
    """
    Parse the Markdown file from MathPix and extract questions and options
    """
    logger.info(f"Parsing Markdown file: {markdown_file_path}")
    
    # Read the markdown file
    with open(markdown_file_path, 'r', encoding='utf-8') as f:
        markdown_text = f.read()
    
    # Process the first question footnote specifically - looking for [^0]
    first_question_equation = ""
    first_footnote_match = re.search(r'\[\^0\]:\s*(.*?)(?=\n\s*\n|\n\[\^|\n##|$)', markdown_text, re.DOTALL)
    if first_footnote_match:
        footnote_content = first_footnote_match.group(1).strip()
        logger.info(f"Found first question footnote: {footnote_content}")
        
        # Extract equation from footnote
        equation_match = re.search(r'ID:.*?\$([^$]+)\$', footnote_content)
        if equation_match:
            first_question_equation = equation_match.group(1).strip()
            logger.info(f"First question equation: {first_question_equation}")
    
    # Extract all other footnotes
    footnotes = {}
    footnote_pattern = r'\[\^(\d+)\]:\s*(.*?)(?=\n\s*\n|\n\[\^|\n##|$)'
    for match in re.finditer(footnote_pattern, markdown_text, re.DOTALL):
        footnote_num = match.group(1)
        footnote_content = match.group(2).strip()
        footnotes[footnote_num] = footnote_content
        logger.info(f"Found footnote [{footnote_num}]: {footnote_content}")
    
    # Split the markdown text into question blocks using Question ID pattern
    question_blocks = re.split(r'## Question ID ([a-zA-Z0-9]+)', markdown_text)
    
    # First element is empty or header info, remove it
    if not question_blocks[0].strip():
        question_blocks = question_blocks[1:]
    
    questions = []
    options = []
    question_id_counter = 1
    option_id_counter = 1
    
    # Process each question block
    for i in range(0, len(question_blocks), 2):
        if i + 1 >= len(question_blocks):
            break
            
        sat_question_id = question_blocks[i].strip()
        question_content = question_blocks[i + 1].strip()
        
        logger.info(f"Processing question ID: {sat_question_id}")
        
        # Extract subject metadata (always Math for this case)
        subject_id = 1
        subject_name = "Math"
        
        # Extract category and subcategory (always Advanced Math/Nonlinear Equations for this case)
        category_id = 1
        category_name = "Advanced Math"
        subcategory_id = 2
        subcategory_name = "Nonlinear Equations and Systems"
        
        # Extract difficulty
        difficulty_match = re.search(r'Question Difficulty:\s*(Easy|Medium|Hard)', question_content)
        difficulty = difficulty_match.group(1) if difficulty_match else "Medium"
        
        # Check for image URL
        image_url = None
        image_match = re.search(r'!\[\]\((.*?)\)', question_content)
        if image_match:
            image_url = image_match.group(1)
            logger.info(f"Found image URL: {image_url}")
            
            # Remove image markup from question content
            question_content = question_content.replace(image_match.group(0), "")
        
        # Extract question text
        full_question_text = ""
        
        # Find the ID section that marks the actual question content
        id_header_match = re.search(r'## ID: ([a-zA-Z0-9]+)\s*\n', question_content)
        
        if id_header_match:
            id_pos = id_header_match.end()
            
            # Extract content after the ID header and before options or next section
            next_section_match = re.search(r'(?:^|\n)(?:A\.|##)', question_content[id_pos:])
            if next_section_match:
                question_end = id_pos + next_section_match.start()
                raw_question_text = question_content[id_pos:question_end].strip()
            else:
                raw_question_text = question_content[id_pos:].strip()
            
            # Check for footnote references in the question text
            footnote_ref_match = re.search(r'\[\^(\d+)\](.*?)$', raw_question_text, re.DOTALL)
            if footnote_ref_match:
                footnote_num = footnote_ref_match.group(1)
                main_question_text = footnote_ref_match.group(2).strip()
                
                # Special handling for first question with [^0]
                if i == 0 and first_question_equation and footnote_num == "0":
                    full_question_text = f"$${first_question_equation}$$\n{main_question_text}"
                # Regular footnote handling
                elif footnote_num in footnotes:
                    # Extract equation from footnote
                    footnote_content = footnotes[footnote_num]
                    
                    # Look for equation in footnote
                    eq_match = re.search(r'(?:ID:.*?)?(\$.*?\$)', footnote_content)
                    if eq_match:
                        eq_content = eq_match.group(1).strip()
                        # Ensure equation is wrapped in double $$ for display math
                        if eq_content.startswith('$') and eq_content.endswith('$'):
                            eq_content = eq_content[1:-1]
                        equation_text = f"$${eq_content}$$"
                        
                        # Combine equation and question text
                        full_question_text = f"{equation_text}\n{main_question_text}"
                    else:
                        full_question_text = main_question_text
                else:
                    full_question_text = main_question_text
            else:
                # No footnote reference, use the raw question text
                full_question_text = raw_question_text
        else:
            # No ID header found, try alternative approach
            # Look for the question text directly
            question_match = re.search(r'(?:Which of the following.*?\?|What is.*?\?)', question_content, re.DOTALL)
            if question_match:
                full_question_text = question_match.group(0).strip()
        
        # Extract options (only from A-D lines, not from other parts of the text)
        option_values = []
        option_section = question_content
        
        # Find where options start (look for "A.")
        options_start_match = re.search(r'(?:^|\n)A\.', question_content)
        if options_start_match:
            option_section = question_content[options_start_match.start():]
        
        # Find where options end (look for "## ID:" or "Correct Answer:")
        options_end_match = re.search(r'(?:^|\n)(?:## ID:|Correct Answer:)', option_section)
        if options_end_match:
            option_section = option_section[:options_end_match.start()]
        
        # Extract each option
        option_pattern = r'(?:^|\n)([A-D])\.\s+(.*?)(?=\n[A-D]\.|\n##|\n\s*$|$)'
        option_matches = re.finditer(option_pattern, option_section, re.DOTALL)
        
        for match in option_matches:
            option_letter = match.group(1)
            option_text = match.group(2).strip()
            # Clean up multi-line option text
            option_text = re.sub(r'\s+', ' ', option_text).strip()
            
            option_values.append({
                "id": option_id_counter,
                "question_id": question_id_counter,
                "value": option_letter,
                "label": option_text,
                "is_correct": False  # Will update after finding correct answer
            })
            option_id_counter += 1
        
        # Find correct answer
        answer_section_match = re.search(r'## ID:.*?Answer\s*\n+Correct Answer:\s*([A-D]|[\d\s,\-]+)', question_content, re.DOTALL)
        if answer_section_match:
            correct_answer = answer_section_match.group(1).strip()
            
            # Update is_correct for matching option
            for option in option_values:
                if option["value"] == correct_answer:
                    option["is_correct"] = True
                    break
        
        # Create the question entry
        if full_question_text:
            current_question = {
                "id": question_id_counter,
                "question_text": full_question_text,
                "image_url": image_url,
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

def main(markdown_file_path):
    """
    Main function to parse the markdown file and generate JSON output
    """
    try:
        # Parse the markdown file
        questions, options = parse_markdown_file(markdown_file_path)
        
        # Save results to JSON - ensure backslashes are not escaped
        with open("questions.json", "w", encoding="utf-8") as f:
            json.dump(questions, f, indent=2, ensure_ascii=False)
        
        with open("options.json", "w", encoding="utf-8") as f:
            json.dump(options, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Processing complete. Results saved to questions.json and options.json")
        
    except Exception as e:
        logger.error(f"Error processing markdown file: {str(e)}")

if __name__ == "__main__":
    # Path to the markdown file
    markdown_file_path = "Nonlinear Equations and Systems 1~Key (1).md"
    
    # Process the markdown file
    main(markdown_file_path)