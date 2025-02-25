import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import path from 'path';

// Get the directory path of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local in the root directory
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Constants
const MATH_SUBJECT_ID = 1;
const READING_WRITING_SUBJECT_ID = 2;

const MATH_CATEGORIES = {
  'Algebra': 1,
  'Advanced Math': 2,
  'Problem-Solving and Data Analysis': 3,
  'Geometry and Trigonometry': 4
};

const READING_WRITING_CATEGORIES = {
  'Standard English Conventions': 1,
  'Expression of Ideas': 2,
  'Information and Ideas': 3,
  'Craft and Structure': 4
};

// Logging utility
const log = {
  info: (message) => console.log(`[INFO] ${message}`),
  error: (message) => console.error(`[ERROR] ${message}`),
  success: (message) => console.log(`[SUCCESS] ${message}`),
  progress: (message) => console.log(`[PROGRESS] ${message}`)
};

async function processFile(filePath, subjectId, categoryId) {
  try {
    log.info(`Processing file: ${filePath}`);
    
    // TODO: Add PDF processing logic here
    // This will be implemented in the next step
    
    log.success(`Successfully processed file: ${filePath}`);
  } catch (error) {
    log.error(`Error processing file ${filePath}: ${error.message}`);
    // Add to failed files log
    await fs.appendFile(
      join(__dirname, 'failed_files.log'),
      `${filePath}\t${error.message}\n`
    );
  }
}

async function processDirectory(dirPath, subjectId, categories) {
  try {
    const files = await fs.readdir(dirPath);
    
    for (const file of files) {
      const filePath = join(dirPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isDirectory()) {
        // If it's a category directory, find the corresponding category ID
        const categoryName = file;
        const categoryId = categories[categoryName];
        
        if (!categoryId) {
          log.error(`Unknown category: ${categoryName}`);
          continue;
        }
        
        // Process all PDFs in this category
        const categoryPath = join(dirPath, file);
        const categoryFiles = await fs.readdir(categoryPath);
        
        for (const pdfFile of categoryFiles) {
          if (pdfFile.endsWith('.pdf')) {
            await processFile(join(categoryPath, pdfFile), subjectId, categoryId);
          }
        }
      }
    }
  } catch (error) {
    log.error(`Error processing directory ${dirPath}: ${error.message}`);
  }
}

async function main() {
  try {
    log.info('Starting database population process...');
    
    // Process Math questions
    const mathDir = join(__dirname, '../../sat-question-bank/Math');
    await processDirectory(mathDir, MATH_SUBJECT_ID, MATH_CATEGORIES);
    
    // Process Reading & Writing questions
    const rwDir = join(__dirname, '../../sat-question-bank/Reading & Writing');
    await processDirectory(rwDir, READING_WRITING_SUBJECT_ID, READING_WRITING_CATEGORIES);
    
    log.success('Database population completed successfully!');
  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error); 