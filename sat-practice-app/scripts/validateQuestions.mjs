import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { argv } from 'process';

// Get the directory path of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local in the root directory
dotenv.config({ path: join(__dirname, '../.env.local') });

// Logging utility
const log = {
  info: (message) => console.log(`[INFO] ${message}`),
  error: (message) => console.error(`[ERROR] ${message}`),
  success: (message) => console.log(`[SUCCESS] ${message}`),
  progress: (message) => console.log(`[PROGRESS] ${message}`),
  warning: (message) => console.log(`[WARNING] ${message}`)
};

/**
 * Find all question and option JSON files in the generated directory
 * @returns {Object} - Object with arrays of question and option file paths
 */
async function findJsonFiles() {
  try {
    const generatedDir = join(__dirname, '../generated');
    const files = await fs.readdir(generatedDir);
    
    const questionFiles = [];
    const optionFiles = [];
    
    for (const file of files) {
      if (file.startsWith('questions-') && file.endsWith('.json')) {
        questionFiles.push(join(generatedDir, file));
      } else if (file.startsWith('options-') && file.endsWith('.json')) {
        optionFiles.push(join(generatedDir, file));
      }
    }
    
    log.info(`Found ${questionFiles.length} question files and ${optionFiles.length} option files`);
    return { questionFiles, optionFiles };
  } catch (error) {
    log.error(`Error finding JSON files: ${error.message}`);
    return { questionFiles: [], optionFiles: [] };
  }
}

/**
 * Read and parse a JSON file
 * @param {string} filePath - Path to the JSON file
 * @returns {Array} - Parsed JSON content
 */
async function readJsonFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    log.error(`Error reading JSON file ${filePath}: ${error.message}`);
    return [];
  }
}

/**
 * Match questions with their corresponding options
 * @param {Array} questions - Array of question objects
 * @param {Array} options - Array of option objects
 * @returns {Array} - Array of complete question objects with options
 */
function matchQuestionsWithOptions(questions, options) {
  const completeQuestions = [];
  
  for (const question of questions) {
    const questionOptions = options.filter(opt => opt.question_id === question.id);
    
    if (questionOptions.length === 0) {
      log.warning(`No options found for question ID: ${question.id}`);
      continue;
    }
    
    if (questionOptions.length !== 4) {
      log.warning(`Question ID ${question.id} has ${questionOptions.length} options instead of 4`);
    }
    
    // Sort options by value (A, B, C, D)
    questionOptions.sort((a, b) => a.value.localeCompare(b.value));
    
    completeQuestions.push({
      ...question,
      options: questionOptions
    });
  }
  
  return completeQuestions;
}

/**
 * Validate a question using Gemini API
 * @param {Object} question - Complete question object with options
 * @returns {Object} - Validation result
 */
async function validateQuestion(question) {
  try {
    log.progress(`Validating question ID: ${question.id}`);
    
    // Create a prompt for Gemini
    const prompt = `
You are an expert SAT question validator. Please analyze the following SAT question and identify any issues with it:

Question Text: ${question.question_text}
${question.image_url ? `Image URL: ${question.image_url}` : 'No image'}
Difficulty: ${question.difficulty}
Subject: ${question.subject}
Category: ${question.category}
Subcategory: ${question.subcategory}

Options:
${question.options.map(opt => `${opt.value}. ${opt.label} ${opt.is_correct ? '(Marked as correct)' : ''}`).join('\n')}

Please evaluate this question for the following issues:
1. Does the question make sense and is it clearly written?
2. Is the option marked as correct actually correct?
3. Are all other options clearly incorrect?
4. Are there any grammatical or formatting issues?
5. Is the difficulty level (${question.difficulty}) appropriate for this question?

Return your analysis in JSON format:
{
  "is_valid": true/false,
  "issues": [
    "List any issues found, or empty array if none"
  ],
  "correct_answer": "The letter of the option that should be correct (A, B, C, or D)",
  "explanation": "Explanation of your analysis"
}
`;

    // Get the Gemini API key from environment variables
    const apiKey = "";
    // log.progress(process.env.GEMINI_API_KEY_2);

    // Prepare the request payload for Gemini API
    const payload = {
      contents: [{
        parts: [
          {
            text: prompt
          }
        ]
      }],
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40
      }
    };

    // Make the API request to Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1alpha/models/gemini-2.0-flash-thinking-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    // Parse the response
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(`Gemini API error: ${JSON.stringify(responseData)}`);
    }
    
    // Extract the generated content
    const generatedContent = responseData.candidates[0].content.parts[0].text;
    
    // More aggressive cleaning of the response
    let cleanedContent = generatedContent
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\\(?!["\\/bfnrtu])/g, '\\\\'); // Escape all backslashes not part of valid escape sequences
    
    // Fix common LaTeX patterns that cause JSON parsing issues
    cleanedContent = cleanedContent
      .replace(/\\\\/g, '\\\\\\\\') // Double backslashes need to be quadruple escaped in JSON
      .replace(/\\"/g, '\\\\"')     // Escaped quotes need double escaping
      .replace(/\$\\\\?[a-zA-Z]+\$/g, match => match.replace(/\\/g, '\\\\')); // Fix LaTeX commands in math mode
    
    // Extract JSON from the cleaned response
    const jsonMatch = cleanedContent.match(/```json\n([\s\S]*?)\n```/) || 
                      cleanedContent.match(/```\n([\s\S]*?)\n```/) ||
                      cleanedContent.match(/\{\s*"is_valid"[\s\S]*\}/);
    
    let jsonContent = '';
    if (jsonMatch) {
      jsonContent = jsonMatch[1] || jsonMatch[0];
    } else {
      // If no JSON block found, try to extract just the validation part
      const validationMatch = cleanedContent.match(/\{\s*"is_valid"[\s\S]*?\}\s*(?:\n|$)/);
      if (validationMatch) {
        jsonContent = validationMatch[0];
      } else {
        jsonContent = cleanedContent;
      }
    }
    
    // Additional cleaning for common JSON issues
    jsonContent = jsonContent
      .replace(/,\s*}/g, '}')  // Remove trailing commas in objects
      .replace(/,\s*\]/g, ']') // Remove trailing commas in arrays
      .replace(/([^\\])\\([^"\\\/bfnrtu])/g, '$1\\\\$2') // Fix remaining invalid escapes
      .replace(/([^\\])\\\\([^"\\\/bfnrtu])/g, '$1\\\\\\\\$2') // Fix double backslashes
      .trim();
    
    try {
      // Parse the validation result
      const validationResult = JSON.parse(jsonContent);
      
      return {
        question_id: question.id,
        question_text: question.question_text.substring(0, 100) + '...',
        validation: validationResult
      };
    } catch (parseError) {
      // If JSON parsing still fails, try a more aggressive approach
      log.warning(`Failed to parse JSON for question ID ${question.id}, attempting fallback parsing`);
      
      // Try to manually extract the validation components
      const isValidMatch = cleanedContent.match(/"is_valid"\s*:\s*(true|false)/i);
      const issuesMatch = cleanedContent.match(/"issues"\s*:\s*(\[[\s\S]*?\])/);
      const correctAnswerMatch = cleanedContent.match(/"correct_answer"\s*:\s*"([^"]*)"/);
      
      let issues = [];
      if (issuesMatch && issuesMatch[1]) {
        try {
          issues = JSON.parse(issuesMatch[1]);
        } catch (e) {
          // If parsing the issues array fails, extract issues as strings
          const issueStrings = cleanedContent.match(/"([^"]*)"(?=\s*(?:,|\]))/g);
          if (issueStrings) {
            issues = issueStrings.map(s => s.replace(/^"|"$/g, ''));
          }
        }
      }
      
      // Create a manually constructed validation result
      const manualResult = {
        is_valid: isValidMatch ? isValidMatch[1] === 'true' : false,
        issues: issues.length ? issues : [`Failed to parse validation result: ${parseError.message}. Original content: ${jsonContent.substring(0, 200)}...`],
        correct_answer: correctAnswerMatch ? correctAnswerMatch[1] : 'Unknown',
        explanation: 'Validation failed due to JSON parsing error'
      };
      
      return {
        question_id: question.id,
        question_text: question.question_text.substring(0, 100) + '...',
        validation: manualResult
      };
    }
  } catch (error) {
    log.error(`Error validating question ID ${question.id}: ${error.message}`);
    return {
      question_id: question.id,
      question_text: question.question_text.substring(0, 100) + '...',
      validation: {
        is_valid: false,
        issues: [`Error during validation: ${error.message}`],
        correct_answer: 'Unknown',
        explanation: 'Validation failed due to an error'
      }
    };
  }
}

/**
 * Save validation results to a JSON file
 * @param {Array} results - Array of validation results
 * @param {string} subcategoryId - Subcategory ID for file naming
 */
async function saveValidationResults(results, subcategoryId) {
  try {
    // Create output directory if it doesn't exist
    const outputDir = join(__dirname, '../validation-results');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Write to JSON file
    await fs.writeFile(
      join(outputDir, `validation-${subcategoryId}.json`),
      JSON.stringify(results, null, 2)
    );
    
    log.success(`Successfully saved validation results for subcategory ${subcategoryId}`);
  } catch (error) {
    log.error(`Error saving validation results for subcategory ${subcategoryId}: ${error.message}`);
  }
}

/**
 * Process a pair of question and option files
 * @param {string} questionFile - Path to the question file
 * @param {string} optionFile - Path to the option file
 */
async function processFiles(questionFile, optionFile) {
  try {
    // Extract subcategory ID from filename
    const subcategoryId = path.basename(questionFile).match(/questions-(\d+)\.json/)[1];
    log.info(`Processing subcategory ID: ${subcategoryId}`);
    
    // Read and parse files
    const questions = await readJsonFile(questionFile);
    const options = await readJsonFile(optionFile);
    
    log.info(`Found ${questions.length} questions and ${options.length} options for subcategory ${subcategoryId}`);
    
    // Match questions with options
    const completeQuestions = matchQuestionsWithOptions(questions, options);
    log.info(`Successfully matched ${completeQuestions.length} questions with their options`);
    
    // Validate each question
    const validationResults = [];
    const validQuestions = [];
    const validOptions = [];
    const invalidQuestions = [];
    
    for (const question of completeQuestions) {
      const result = await validateQuestion(question);
      validationResults.push(result);
      
      if (result.validation.is_valid) {
        // If valid, add to valid arrays
        validQuestions.push(question);
        validOptions.push(...question.options);
        log.success(`Question ID ${question.id} is valid`);
      } else {
        // If invalid, add to invalid questions array for reporting
        invalidQuestions.push({
          question,
          validationResult: result
        });
        log.warning(`Question ID ${question.id} is invalid: ${result.validation.issues.join(', ')}`);
      }
      
      // Add a delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Save validation results
    await saveValidationResults(validationResults, subcategoryId);
    
    // Report on invalid questions
    if (invalidQuestions.length > 0) {
      log.warning(`Removed ${invalidQuestions.length} invalid questions from subcategory ${subcategoryId}`);
      
      // Save invalid questions to a separate file for reference
      await fs.writeFile(
        join(__dirname, '../validation-results', `invalid-${subcategoryId}.json`),
        JSON.stringify(invalidQuestions.map(item => ({
          question_id: item.question.id,
          question_text: item.question.question_text.substring(0, 100) + '...',
          issues: item.validationResult.validation.issues
        })), null, 2)
      );
    } else {
      log.success(`All questions in subcategory ${subcategoryId} are valid!`);
    }
    
    // Save updated questions and options (only valid ones)
    await saveUpdatedFiles(validQuestions, validOptions, subcategoryId);
    log.success(`Successfully saved updated files for subcategory ${subcategoryId} with ${validQuestions.length} valid questions`);
    
    return {
      subcategoryId,
      totalQuestions: completeQuestions.length,
      validQuestions: validQuestions.length,
      invalidQuestions: invalidQuestions.length
    };
    
  } catch (error) {
    log.error(`Error processing files: ${error.message}`);
    return null;
  }
}

/**
 * Save updated questions and options to JSON files
 * @param {Array} questions - Array of valid questions
 * @param {Array} options - Array of valid options
 * @param {string} subcategoryId - Subcategory ID for file naming
 */
async function saveUpdatedFiles(questions, options, subcategoryId) {
  try {
    // Create output directory if it doesn't exist
    const outputDir = join(__dirname, '../updated-files');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Remove options property from questions before saving
    const cleanedQuestions = questions.map(q => {
      const { options, ...questionWithoutOptions } = q;
      return questionWithoutOptions;
    });
    
    // Write to JSON files
    await fs.writeFile(
      join(outputDir, `updated-questions-${subcategoryId}.json`),
      JSON.stringify(cleanedQuestions, null, 2)
    );
    
    await fs.writeFile(
      join(outputDir, `updated-options-${subcategoryId}.json`),
      JSON.stringify(options, null, 2)
    );
    
    log.success(`Successfully saved updated files for subcategory ${subcategoryId}`);
  } catch (error) {
    log.error(`Error saving updated files for subcategory ${subcategoryId}: ${error.message}`);
  }
}

/**
 * Main function to run the script
 */
async function main() {
  try {
    log.info('Starting SAT question validation process...');
    
    // Check if specific subcategory ID was provided as command-line argument
    const testSubcategoryId = argv[2];
    
    if (testSubcategoryId) {
      log.info(`Testing only subcategory ID: ${testSubcategoryId}`);
      
      const generatedDir = join(__dirname, '../generated');
      const questionFile = join(generatedDir, `questions-${testSubcategoryId}.json`);
      const optionFile = join(generatedDir, `options-${testSubcategoryId}.json`);
      
      // Check if files exist
      try {
        await fs.access(questionFile);
        await fs.access(optionFile);
      } catch (error) {
        log.error(`Files for subcategory ${testSubcategoryId} not found`);
        return;
      }
      
      // Process only these files
      await processFiles(questionFile, optionFile);
      
      log.success(`Test completed for subcategory ${testSubcategoryId}`);
      return;
    }
    
    // Original code for processing all files
    const { questionFiles, optionFiles } = await findJsonFiles();
    
    if (questionFiles.length === 0 || optionFiles.length === 0) {
      log.error('No question or option files found');
      return;
    }
    
    // Process each pair of files
    const summary = [];
    
    for (const questionFile of questionFiles) {
      // Extract subcategory ID from filename
      const subcategoryId = path.basename(questionFile).match(/questions-(\d+)\.json/)[1];
      
      // Find matching option file
      const optionFile = optionFiles.find(file => path.basename(file) === `options-${subcategoryId}.json`);
      
      if (!optionFile) {
        log.error(`No matching option file found for ${path.basename(questionFile)}`);
        continue;
      }
      
      const result = await processFiles(questionFile, optionFile);
      
      if (result) {
        summary.push(result);
      }
      
      // Add a delay between subcategories to avoid rate limiting
      log.info(`Waiting 10 seconds before processing next subcategory to avoid rate limiting...`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    // Generate summary report
    log.info('\n=== Validation Summary ===');
    let totalQuestions = 0;
    let totalInvalid = 0;
    
    for (const item of summary) {
      log.info(`Subcategory ${item.subcategoryId}: ${item.invalidQuestions}/${item.totalQuestions} invalid questions`);
      totalQuestions += item.totalQuestions;
      totalInvalid += item.invalidQuestions;
    }
    
    log.info(`\nTotal: ${totalInvalid}/${totalQuestions} invalid questions (${((totalInvalid/totalQuestions)*100).toFixed(2)}%)`);
    
    // Save summary report
    await fs.writeFile(
      join(__dirname, '../validation-results', 'summary.json'),
      JSON.stringify({
        total_questions: totalQuestions,
        total_invalid: totalInvalid,
        percentage_invalid: ((totalInvalid/totalQuestions)*100).toFixed(2),
        subcategories: summary
      }, null, 2)
    );
    
    log.success('Question validation process completed successfully!');
  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error); 