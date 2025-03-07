#!/usr/bin/env python3
"""
Marker API Image Recovery Script

This script re-processes PDFs that have already been converted to markdown
to extract and save the images.
"""

import os
import re
import time
import requests
import json
import base64
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
        print("Please create this file with your API key as MARKER_API_KEY_2=your_api_key_here")
        exit(1)
    
    # Load the variables from the .env.local file
    load_dotenv(dotenv_path=env_path)
    
    # Get the API key
    api_key = os.getenv('MARKER_API_KEY_2')
    
    if not api_key:
        print("Error: MARKER_API_KEY_2 not found in environment file.")
        print("Please add MARKER_API_KEY_2=your_api_key_here to your .env.local file")
        exit(1)
    
    return api_key

API_KEY = load_api_key()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("image_recovery_log.txt"),
        logging.StreamHandler()
    ]
)

# Paths
BASE_DIR = Path(".")  # Current directory (sat-parser/)
SOURCE_DIR = BASE_DIR / "sat-question-bank"
MARKDOWN_DIR = BASE_DIR / "sat-question-bank/markdown"

# Marker API settings
MARKER_API_URL = "https://www.datalab.to/api/v1/marker"

def ensure_directory(directory_path):
    """Ensure that a directory exists, creating it if necessary."""
    if not directory_path.exists():
        directory_path.mkdir(parents=True)
        logging.info(f"Created directory: {directory_path}")

def find_markdown_with_images():
    """Find markdown files that contain image references but don't have the images."""
    markdown_with_images = []
    image_pattern = re.compile(r'!\[\]\(([^)]+)\)')
    
    # Walk through all markdown files
    for root, _, files in os.walk(MARKDOWN_DIR):
        root_path = Path(root)
        
        for file in files:
            if not file.lower().endswith('.md'):
                continue
                
            md_path = root_path / file
            
            # Original PDF path (reverse-engineer from markdown path)
            rel_path = md_path.relative_to(MARKDOWN_DIR)
            pdf_path = SOURCE_DIR / rel_path.with_suffix('.pdf')
            
            # Check if PDF exists
            if not pdf_path.exists():
                logging.warning(f"Source PDF not found for {md_path}")
                continue
            
            # Read markdown content
            with open(md_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Find image references
            image_references = image_pattern.findall(content)
            
            if image_references:
                # Check if images exist
                missing_images = []
                for img_ref in image_references:
                    img_path = root_path / img_ref
                    if not img_path.exists():
                        missing_images.append(img_ref)
                
                if missing_images:
                    markdown_with_images.append({
                        'markdown_path': md_path,
                        'pdf_path': pdf_path,
                        'missing_images': missing_images
                    })
    
    return markdown_with_images

def convert_pdf_to_get_images(pdf_path):
    """Convert a PDF to Markdown using the Marker API to get images."""
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
                    return {
                        'images': data.get('images', {}),
                        'page_count': data.get('page_count', 0)
                    }
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

def save_images(markdown_path, result_data):
    """Save images to the appropriate location."""
    if not result_data or 'images' not in result_data:
        return 0
    
    images = result_data['images']
    if not images:
        return 0
    
    # Save images in same directory as markdown file
    images_dir = markdown_path.parent
    ensure_directory(images_dir)
    
    images_saved = 0
    
    for image_name, image_b64 in images.items():
        try:
            image_path = images_dir / image_name
            
            # Decode the base64 image
            image_data = base64.b64decode(image_b64)
            
            # Save the image
            with open(image_path, 'wb') as img_file:
                img_file.write(image_data)
            
            logging.info(f"Saved image: {image_path}")
            images_saved += 1
        except Exception as e:
            logging.error(f"Error saving image {image_name}: {str(e)}")
    
    return images_saved

def main():
    """Main function to recover images for markdown files."""
    print("Scanning for markdown files with missing images...")
    markdown_files = find_markdown_with_images()
    
    if not markdown_files:
        print("No markdown files with missing images found.")
        return
    
    count = len(markdown_files)
    print(f"Found {count} markdown files with missing images.")
    
    estimated_cost = count * 0.03 * 5  # Assuming 5 pages per PDF at $0.03/page
    print(f"\nEstimated cost to recover images: ${estimated_cost:.2f}")
    print("Would you like to continue? (y/n)")
    
    user_response = input().strip().lower()
    if user_response != 'y':
        print("Operation cancelled")
        return
    
    successful = 0
    failed = 0
    total_images = 0
    
    for i, item in enumerate(markdown_files):
        md_path = item['markdown_path']
        pdf_path = item['pdf_path']
        
        print(f"\nProcessing {i+1}/{count}: {pdf_path.name}")
        result_data = convert_pdf_to_get_images(pdf_path)
        
        if result_data:
            images_saved = save_images(md_path, result_data)
            if images_saved > 0:
                successful += 1
                total_images += images_saved
                print(f"✅ Recovered {images_saved} images for {pdf_path.name}")
            else:
                failed += 1
                print(f"❌ No images found for {pdf_path.name}")
        else:
            failed += 1
            print(f"❌ Failed to process {pdf_path.name}")
        
        # Add a small delay to avoid rate limiting
        time.sleep(1)
    
    print(f"\nImage recovery complete!")
    print(f"Successfully processed: {successful} files")
    print(f"Failed to process: {failed} files")
    print(f"Total images recovered: {total_images}")
    print(f"Check the image_recovery_log.txt file for detailed information")

if __name__ == "__main__":
    main()