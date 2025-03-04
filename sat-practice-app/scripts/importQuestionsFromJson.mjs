import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

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

// Logging utility
const log = {
  info: (message) => console.log(`[INFO] ${message}`),
  error: (message) => console.error(`[ERROR] ${message}`),
  success: (message) => console.log(`[SUCCESS] ${message}`),
  progress: (message) => console.log(`[PROGRESS] ${message}`)
};

// Function to import a single question
async function importQuestion(question) {
  try {
    // Format the question data according to your database schema
    const questionData = {
      id: question.id,
      question_text: question.question_text,
      image_url: question.image_url,
      difficulty: question.difficulty,
      main_category: question.category, // Assuming main_category is the same as category
      subcategory: question.subcategory,
      subject: question.subject,
      subject_id: question.subject_id,
      test_id: null, // You may need to set this based on your requirements
      subcategory_id: question.subcategory_id
    };

    // Insert the question into the database
    const { data, error } = await supabase
      .from('questions')
      .upsert(questionData, { 
        onConflict: 'id',
        returning: 'minimal' // Don't return the inserted data to save bandwidth
      });

    if (error) {
      throw new Error(`Failed to insert question ${question.id}: ${error.message}`);
    }

    return true;
  } catch (error) {
    log.error(`Error importing question ${question.id}: ${error.message}`);
    return false;
  }
}

// Function to process a single JSON file
async function processJsonFile(filePath) {
  try {
    log.info(`Processing file: ${filePath}`);
    
    // Read and parse the JSON file
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const questions = JSON.parse(fileContent);
    
    log.info(`Found ${questions.length} questions in ${filePath}`);
    
    // Import questions in batches to avoid overwhelming the database
    const batchSize = 50;
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);
      log.progress(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(questions.length / batchSize)}`);
      
      // Process questions in parallel for better performance
      const results = await Promise.all(batch.map(question => importQuestion(question)));
      
      // Count successes and failures
      const batchSuccesses = results.filter(result => result).length;
      successCount += batchSuccesses;
      failCount += (batch.length - batchSuccesses);
    }
    
    log.success(`Completed processing ${filePath}: ${successCount} questions imported, ${failCount} failed`);
    return { success: successCount, fail: failCount };
  } catch (error) {
    log.error(`Error processing file ${filePath}: ${error.message}`);
    return { success: 0, fail: 0 };
  }
}

// Main function to process all JSON files
async function main() {
  try {
    log.info('Starting question import process...');
    
    // Find all updated-questions-*.json files
    const jsonFiles = glob.sync(join(__dirname, '../updated-files/updated-questions-*.json'));
    
    if (jsonFiles.length === 0) {
      log.error('No question JSON files found');
      process.exit(1);
    }
    
    log.info(`Found ${jsonFiles.length} JSON files to process`);
    
    let totalSuccess = 0;
    let totalFail = 0;
    
    // Process each file
    for (const filePath of jsonFiles) {
      const { success, fail } = await processJsonFile(filePath);
      totalSuccess += success;
      totalFail += fail;
    }
    
    log.success(`Import completed: ${totalSuccess} questions imported successfully, ${totalFail} failed`);
  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  log.error(`Unhandled error: ${error.message}`);
  process.exit(1);
}); 