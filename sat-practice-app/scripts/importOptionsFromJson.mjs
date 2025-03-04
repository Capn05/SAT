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

// Function to import a single option
async function importOption(option) {
  try {
    // Format the option data according to your database schema
    const optionData = {
      id: option.id,
      question_id: option.question_id,
      value: option.value,
      label: option.label,
      is_correct: option.is_correct
    };

    // Insert the option into the database
    const { data, error } = await supabase
      .from('options')
      .upsert(optionData, { 
        onConflict: 'id',
        returning: 'minimal' // Don't return the inserted data to save bandwidth
      });

    if (error) {
      throw new Error(`Failed to insert option ${option.id}: ${error.message}`);
    }

    return true;
  } catch (error) {
    log.error(`Error importing option ${option.id}: ${error.message}`);
    return false;
  }
}

// Function to process a single JSON file
async function processJsonFile(filePath) {
  try {
    log.info(`Processing file: ${filePath}`);
    
    // Read and parse the JSON file
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const options = JSON.parse(fileContent);
    
    log.info(`Found ${options.length} options in ${filePath}`);
    
    // Import options in batches to avoid overwhelming the database
    const batchSize = 100; // Larger batch size for options since they're simpler
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < options.length; i += batchSize) {
      const batch = options.slice(i, i + batchSize);
      log.progress(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(options.length / batchSize)}`);
      
      // Process options in parallel for better performance
      const results = await Promise.all(batch.map(option => importOption(option)));
      
      // Count successes and failures
      const batchSuccesses = results.filter(result => result).length;
      successCount += batchSuccesses;
      failCount += (batch.length - batchSuccesses);
    }
    
    log.success(`Completed processing ${filePath}: ${successCount} options imported, ${failCount} failed`);
    return { success: successCount, fail: failCount };
  } catch (error) {
    log.error(`Error processing file ${filePath}: ${error.message}`);
    return { success: 0, fail: 0 };
  }
}

// Main function to process all JSON files
async function main() {
  try {
    log.info('Starting options import process...');
    
    // Find all updated-options-*.json files
    const jsonFiles = glob.sync(join(__dirname, '../updated-files/updated-options-*.json'));
    
    if (jsonFiles.length === 0) {
      log.error('No options JSON files found');
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
    
    log.success(`Import completed: ${totalSuccess} options imported successfully, ${totalFail} failed`);
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