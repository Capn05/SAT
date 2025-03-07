#!/usr/bin/env python3
"""
SAT Question Bank PDF to Markdown Converter using Marker API

This script walks through the sat-question-bank directory structure,
finds all PDFs, and converts them to Markdown using the Marker API.
The output maintains the same directory structure as the input.
"""

import os
import time
import requests
import json
from pathlib import Path
import logging
from dotenv import load_dotenv

# Load API key from .env.local file
def load_api_key():
    # Path to the .env.local file (one directory up from the current script)
    env_path = Path(__file__).parent.parent / '.env.local'
    
    # Check if the file exists
    if not env_path.exists():
        print(f"Error: Environment file not found at {env_path}")
        print("Please create this file with your API key as MARKER_API_KEY_1=your_api_key_here")
        exit(1)
    
    # Load the variables from the .env.local file
    load_dotenv(dotenv_path=env_path)
    
    # Get the API key
    api_key = os.getenv('MARKER_API_KEY_1')
    
    if not api_key:
        print("Error: MARKER_API_KEY_1 not found in environment file.")
        print("Please add MARKER_API_KEY_1=your_api_key_here to your .env.local file")
        exit(1)
    
    return api_key

API_KEY = load_api_key()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("conversion_log.txt"),
        logging.StreamHandler()
    ]
)

# Paths
BASE_DIR = Path(".")  # Current directory (sat-parser/)
SOURCE_DIR = BASE_DIR / "sat-question-bank"
OUTPUT_DIR = BASE_DIR / "sat-question-bank/markdown"

# Marker API settings
MARKER_API_URL = "https://www.datalab.to/api/v1/marker"

def ensure_directory(directory_path):
    """Ensure that a directory exists, creating it if necessary."""
    if not directory_path.exists():
        directory_path.mkdir(parents=True)
        logging.info(f"Created directory: {directory_path}")

def get_pdf_paths():
    """Walk through the source directory and collect all PDF file paths."""
    pdf_paths = []
    
    for root, _, files in os.walk(SOURCE_DIR):
        root_path = Path(root)
        for file in files:
            if file.lower().endswith('.pdf'):
                pdf_paths.append(root_path / file)
    
    return pdf_paths

def convert_to_markdown(pdf_path):
    """Convert a PDF to Markdown using the Marker API."""
    try:
        logging.info(f"Processing: {pdf_path}")
        
        # Submit PDF to Marker API
        with open(pdf_path, "rb") as pdf_file:
            form_data = {
                'file': (pdf_path.name, pdf_file, 'application/pdf'),
                'langs': (None, "English"),
                'output_format': (None, 'markdown'),
                'force_ocr': (None, "True"),  # Force OCR for better quality
                'paginate': (None, "True"),   # Add page delimiters
                'use_llm': (None, "False"),   # Don't use LLM to reduce cost
                'strip_existing_ocr': (None, "False"),
                'disable_image_extraction': (None, "False")
            }
            
            headers = {"X-Api-Key": API_KEY}
            
            logging.info("Sending request to Marker API...")
            response = requests.post(
                MARKER_API_URL,
                files=form_data,
                headers=headers
            )
            
            # Log the response status
            logging.info(f"Response status: {response.status_code}")
            if response.status_code != 200:
                logging.error(f"Error response: {response.text}")
                return None
        
        response.raise_for_status()
        result = response.json()
        
        # Check if the request was successful and a request_id was returned
        if not result.get('success') or 'request_check_url' not in result:
            logging.error(f"Failed to submit PDF: {result}")
            return None
        
        request_check_url = result['request_check_url']
        request_id = result['request_id']
        logging.info(f"PDF submitted successfully. Request ID: {request_id}")
        
        # Wait for processing and retrieve the results
        return retrieve_results(request_check_url)
        
    except Exception as e:
        logging.error(f"Error converting {pdf_path}: {str(e)}")
        return None

def retrieve_results(check_url):
    """Poll the Marker API to retrieve the conversion result."""
    max_polls = 60  # 2 minutes max wait time
    poll_interval = 2  # seconds
    
    headers = {"X-Api-Key": API_KEY}
    
    for i in range(max_polls):
        try:
            logging.info(f"Checking conversion status (attempt {i+1}/{max_polls})...")
            
            response = requests.get(check_url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            status = data.get('status')
            logging.info(f"Status: {status}")
            
            if status == "complete":
                if data.get('success'):
                    logging.info("Conversion completed successfully")
                    return data.get('markdown')  # Return markdown content
                else:
                    logging.error(f"Conversion failed: {data.get('error', 'Unknown error')}")
                    return None
            
            # If still processing, wait and try again
            time.sleep(poll_interval)
            
        except Exception as e:
            logging.error(f"Error retrieving results: {str(e)}")
            time.sleep(poll_interval)
    
    logging.error("Maximum polling attempts reached. Conversion timed out.")
    return None

def save_markdown(pdf_path, markdown_content):
    """Save the Markdown content to a file with the same structure as the source."""
    if markdown_content is None:
        return False
    
    # Determine the output path - maintain subdirectory structure beyond the base source dir
    rel_parts = pdf_path.relative_to(SOURCE_DIR).parts
    if len(rel_parts) > 1:  # If there are subdirectories
        # Keep the subdirectory structure
        output_path = OUTPUT_DIR / Path(*rel_parts).with_suffix('.md')
    else:
        # If it's directly in the source dir, just put it in the output dir
        output_path = OUTPUT_DIR / pdf_path.name.replace('.pdf', '.md')
    
    # Ensure the output directory exists
    ensure_directory(output_path.parent)
    
    # Save the Markdown content
    with open(output_path, 'w', encoding='utf-8') as md_file:
        md_file.write(markdown_content)
    
    logging.info(f"Saved Markdown to: {output_path}")
    return True

def calculate_estimated_cost(pdf_paths):
    """Calculate an estimated cost based on the number of PDFs."""
    # Estimate average pages per PDF (adjust this based on your knowledge of the PDFs)
    avg_pages_per_pdf = 5
    total_estimated_pages = len(pdf_paths) * avg_pages_per_pdf
    
    # Marker pricing as of February 2025 (per the documentation)
    # Estimated at $0.03 per page for PDF-to-markdown conversion with forced OCR
    estimated_cost = total_estimated_pages * 0.03
    
    return estimated_cost, total_estimated_pages

def main():
    """Main function to process all PDFs in the directory structure."""
    # Ensure the output directory exists
    ensure_directory(OUTPUT_DIR)
    
    # Get all PDF paths
    pdf_paths = get_pdf_paths()
    pdf_count = len(pdf_paths)
    logging.info(f"Found {pdf_count} PDF files")
    print(f"\nFound {pdf_count} PDF files to process")
    
    # Calculate and display estimated cost
    estimated_cost, total_pages = calculate_estimated_cost(pdf_paths)
    logging.info(f"Estimated cost: ${estimated_cost:.2f} (based on est. {total_pages} pages at $0.03/page)")
    print(f"\nEstimated cost: ${estimated_cost:.2f} (based on est. {total_pages} pages at $0.03/page)")
    print("Would you like to continue? (y/n)")
    
    user_response = input().strip().lower()
    if user_response != 'y':
        logging.info("User cancelled the operation")
        print("Operation cancelled")
        return
    
    # Process each PDF
    successful = 0
    failed = 0
    
    for i, pdf_path in enumerate(pdf_paths):
        print(f"\nProcessing {i+1}/{pdf_count}: {pdf_path}")
        markdown_content = convert_to_markdown(pdf_path)
        
        if save_markdown(pdf_path, markdown_content):
            successful += 1
            print(f"✅ Successfully converted: {pdf_path.name}")
        else:
            failed += 1
            print(f"❌ Failed to convert: {pdf_path.name}")
        
        # Add a small delay between requests to avoid rate limiting
        time.sleep(1)
    
    # Log summary
    logging.info(f"Conversion complete. Successful: {successful}, Failed: {failed}")
    print(f"\nConversion complete!")
    print(f"Successfully converted: {successful} files")
    print(f"Failed to convert: {failed} files")
    print(f"Check the conversion_log.txt file for detailed information")

if __name__ == "__main__":
    main()