import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import fetch from 'node-fetch'; // Add node-fetch for HTTP requests

// Get the directory path of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local in the root directory
dotenv.config({ path: join(__dirname, '../.env.local') });

// Mapping for subject, category, and subcategory IDs
const SUBJECT_MAPPING = {
  'Math': 1,
  'Reading & Writing': 4
};

const CATEGORY_MAPPING = {
  'Advanced Math': { subject_id: 1, category_id: 1 },
  'Algebra': { subject_id: 1, category_id: 2 },
  'Craft and Structure': { subject_id: 4, category_id: 4 },
  'Information and Ideas': { subject_id: 4, category_id: 5 },
  'Standard English Conventions': { subject_id: 4, category_id: 6 },
  'Problem-Solving and Data Analysis': { subject_id: 1, category_id: 7 },
  'Geometry and Trigonometry': { subject_id: 1, category_id: 8 },
  'Expression of Ideas': { subject_id: 4, category_id: 9 }
};

const SUBCATEGORY_MAPPING = {
  'Equivalent Expressions': { category_id: 1, subcategory_id: 1 },
  'Nonlinear Equations and Systems': { category_id: 1, subcategory_id: 2 },
  'Nonlinear Functions': { category_id: 1, subcategory_id: 3 },
  'Data Analysis': { category_id: 3, subcategory_id: 7 },
  'Linear Equations in One Variable': { category_id: 2, subcategory_id: 14 },
  'Linear Equations in Two Variables': { category_id: 2, subcategory_id: 15 },
  'Linear Functions': { category_id: 2, subcategory_id: 16 },
  'Linear Inequalities': { category_id: 2, subcategory_id: 17 },
  'Systems of Linear Equations': { category_id: 2, subcategory_id: 18 },
  'One-Variable Data': { category_id: 7, subcategory_id: 19 },
  'Two-Variable Data': { category_id: 7, subcategory_id: 20 },
  'Probability': { category_id: 7, subcategory_id: 21 },
  'Sample Statistics and Margin of Error': { category_id: 7, subcategory_id: 22 },
  'Evaluating Statistical Claims': { category_id: 7, subcategory_id: 23 },
  'Percentages': { category_id: 7, subcategory_id: 24 },
  'Ratios, Rates, Proportions, and Units': { category_id: 7, subcategory_id: 25 },
  'Lines, Angles, and Triangles': { category_id: 8, subcategory_id: 26 },
  'Right Triangles and Trigonometry': { category_id: 8, subcategory_id: 27 },
  'Circles': { category_id: 8, subcategory_id: 28 },
  'Area and Volume': { category_id: 8, subcategory_id: 29 },
  'Central Ideas and Details': { category_id: 5, subcategory_id: 30 },
  'Command of Evidence': { category_id: 5, subcategory_id: 31 },
  'Inferences': { category_id: 5, subcategory_id: 32 },
  'Text, Structure, and Purpose': { category_id: 4, subcategory_id: 33 },
  'Words in Context': { category_id: 4, subcategory_id: 34 },
  'Cross-Text Connections': { category_id: 4, subcategory_id: 35 },
  'Rhetorical Synthesis': { category_id: 9, subcategory_id: 36 },
  'Transitions': { category_id: 9, subcategory_id: 37 },
  'Boundaries': { category_id: 6, subcategory_id: 38 },
  'Form, Structure, and Sense': { category_id: 6, subcategory_id: 39 }
};

// Logging utility
const log = {
  info: (message) => console.log(`[INFO] ${message}`),
  error: (message) => console.error(`[ERROR] ${message}`),
  success: (message) => console.log(`[SUCCESS] ${message}`),
  progress: (message) => console.log(`[PROGRESS] ${message}`)
};

/**
 * Get metadata for a file based on its path
 * @param {string} filePath - Path to the markdown file
 * @returns {Object} - Metadata including subject, category, subcategory, and IDs
 */
function getMetadataFromPath(filePath) {
  const pathParts = filePath.split(path.sep);
  const fileName = path.basename(filePath, '.md');
  
  // Extract subject, category, and subcategory from path
  const subject = pathParts[pathParts.indexOf('markdown') + 1];
  const category = pathParts[pathParts.indexOf(subject) + 1];
  
  // Extract subcategory from filename (remove difficulty indicator)
  const subcategoryMatch = fileName.match(/(.+?)\s+\d+~Key$/);
  const subcategory = subcategoryMatch ? subcategoryMatch[1] : fileName.replace(/\s+\d+~Key$/, '');
  
  // Determine difficulty based on filename
  let difficulty = 'Medium'; // Default
  if (fileName.includes('1~Key')) {
    difficulty = 'Easy';
  } else if (fileName.includes('2~Key')) {
    difficulty = 'Medium';
  } else if (fileName.includes('3~Key')) {
    difficulty = 'Hard';
  }
  
  // Log the extracted difficulty for debugging
  console.log(`File: ${fileName}, Extracted difficulty: ${difficulty}`);
  
  // Get IDs from mappings
  const subject_id = SUBJECT_MAPPING[subject] || 0;
  const category_id = CATEGORY_MAPPING[category]?.category_id || 0;
  const subcategory_id = SUBCATEGORY_MAPPING[subcategory]?.subcategory_id || 0;
  
  return {
    subject,
    category,
    subcategory,
    difficulty,
    subject_id,
    category_id,
    subcategory_id
  };
}

/**
 * Read and parse a markdown file containing SAT questions
 * @param {string} filePath - Path to the markdown file
 * @returns {Array} - Array of parsed questions
 */
async function parseMarkdownFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Get metadata from file path
    const metadata = getMetadataFromPath(filePath);
    
    log.info(`Parsing file: ${path.basename(filePath)} - Difficulty: ${metadata.difficulty}`);
    
    // Split the content by "Question ID" to find all questions
    const questionBlocks = content.split('Question ID').filter(Boolean);
    
    // Parse each question block
    const parsedQuestions = [];
    
    for (let i = 0; i < questionBlocks.length; i++) {
      const questionText = 'Question ID' + questionBlocks[i];
      
      // Extract question ID
      const idMatch = questionText.match(/Question ID[:\s]+([a-f0-9]+)/i);
      const id = idMatch ? idMatch[1] : null;
      
      if (!id) {
        log.error(`Could not extract ID from question block ${i+1}`);
        continue; // Skip this question if ID can't be extracted
      }
      
      // Extract question text - look for content between the ID line and the first option
      // Try different patterns to extract question text
      let questionContent = '';
      const questionTextMatch = questionText.match(/Question ID[^]*?\n(.*?)\n[A-D]\./s);
      if (questionTextMatch) {
        questionContent = questionTextMatch[1].trim();
      } else {
        // Try an alternative pattern if the first one fails
        const altMatch = questionText.match(/Question ID[^]*?\n(.*?)(?=\nA\.|$)/s);
        if (altMatch) {
          questionContent = altMatch[1].trim();
        }
      }
      
      if (!questionContent) {
        log.error(`Could not extract question text for ID: ${id}`);
        continue; // Skip this question if text can't be extracted
      }
      
      // Extract answer options - be more lenient here
      const optionsMatch = questionText.match(/([A-D]\. .*?)(?=[A-D]\.|Correct Answer:|$)/gs);
      let options = [];
      
      if (optionsMatch && optionsMatch.length > 0) {
        options = optionsMatch.map(option => {
          const value = option.substring(0, 1);
          const label = option.substring(3).trim();
          return { value, label };
        });
        
        // If we don't have exactly 4 options, log a warning but continue
        if (options.length !== 4) {
          log.error(`Question ID ${id} has ${options.length} options instead of 4, but continuing anyway`);
        }
      } else {
        // If no options found, create placeholder options
        log.error(`No options found for question ID: ${id}, creating placeholders`);
        options = [
          { value: 'A', label: 'Placeholder A' },
          { value: 'B', label: 'Placeholder B' },
          { value: 'C', label: 'Placeholder C' },
          { value: 'D', label: 'Placeholder D' }
        ];
      }
      
      // Extract correct answer if available
      const correctAnswerMatch = questionText.match(/Correct Answer:\s*([A-D])/i);
      const correctAnswer = correctAnswerMatch ? correctAnswerMatch[1] : 'A'; // Default to A if not found
      
      if (!correctAnswerMatch) {
        log.error(`Could not extract correct answer for question ID: ${id}, defaulting to A`);
      }
      
      // Mark correct option
      options.forEach(option => {
        option.is_correct = option.value === correctAnswer;
      });
      
      // Ensure at least one option is marked as correct
      if (!options.some(opt => opt.is_correct)) {
        if (options.length > 0) {
          options[0].is_correct = true;
          log.error(`No correct option found for question ID: ${id}, marking first option as correct`);
        }
      }
      
      // Extract image URL if present
      const imageMatch = questionText.match(/!\[\]\((.*?)\)/);
      const imageUrl = imageMatch ? imageMatch[1] : null;
      
      // Add the parsed question to the array
      parsedQuestions.push({
        id,
        question_text: questionContent,
        image_url: imageUrl,
        difficulty: metadata.difficulty,
        options,
        subject: metadata.subject,
        category: metadata.category,
        subcategory: metadata.subcategory,
        subject_id: metadata.subject_id,
        category_id: metadata.category_id,
        subcategory_id: metadata.subcategory_id
      });
      
      log.progress(`Extracted question ID: ${id}`);
    }
    
    log.info(`Found ${parsedQuestions.length} questions in ${path.basename(filePath)}`);
    return parsedQuestions;
  } catch (error) {
    log.error(`Error parsing markdown file ${filePath}: ${error.message}`);
    return [];
  }
}

/**
 * Sanitize JSON string to handle special characters like dollar signs
 * @param {string} jsonString - The JSON string to sanitize
 * @returns {string} - Sanitized JSON string
 */
function sanitizeJsonString(jsonString) {
  // Replace escaped dollar signs and other problematic characters
  return jsonString
    .replace(/\\\$/g, '$') // Replace escaped dollar signs
    .replace(/\$(?=\d)/g, '\\$') // Escape dollar signs before numbers
    .replace(/\\\\/g, '\\') // Fix double escapes
    .replace(/\\"/g, '"') // Fix escaped quotes
    .replace(/"\\/g, '"\\') // Fix quotes followed by backslash
    .replace(/\\n/g, '\\n') // Ensure newlines are properly escaped
    .replace(/\\t/g, '\\t'); // Ensure tabs are properly escaped
}

/**
 * Extract questions from Gemini response text
 * @param {string} responseText - The raw response text from Gemini
 * @returns {Array} - Array of extracted question objects
 */
function extractQuestionsFromResponse(responseText) {
  try {
    // Try to parse as JSON first
    try {
      // Extract JSON content from code blocks if present
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                        responseText.match(/```\n([\s\S]*?)\n```/) ||
                        responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
      
      let jsonContent = '';
      if (jsonMatch) {
        jsonContent = jsonMatch[1] || jsonMatch[0];
      } else {
        jsonContent = responseText;
      }
      
      // Replace problematic characters
      jsonContent = jsonContent
        .replace(/\\\$/g, 'DOLLAR_SIGN')
        .replace(/\$/g, 'DOLLAR_SIGN')
        .replace(/\\"/g, '"')
        .replace(/\\n/g, ' ');
      
      // Parse the sanitized JSON
      const parsedQuestions = JSON.parse(jsonContent);
      
      // Restore dollar signs in the parsed objects
      return parsedQuestions.map(q => {
        return {
          question_text: q.question_text.replace(/DOLLAR_SIGN/g, '$'),
          image_url: q.image_url,
          options: q.options.map(opt => ({
            value: opt.value,
            label: opt.label.replace(/DOLLAR_SIGN/g, '$'),
            is_correct: opt.is_correct
          }))
        };
      });
    } catch (jsonError) {
      // If JSON parsing fails, try to extract questions manually
      log.error(`JSON parsing failed: ${jsonError.message}. Trying manual extraction.`);
      
      // Extract question blocks using regex patterns
      const questionBlocks = responseText.match(/\{\s*"question_text"[\s\S]*?"is_correct":\s*(true|false)\s*\}\s*\]/g);
      
      if (!questionBlocks || questionBlocks.length === 0) {
        throw new Error('Could not extract question blocks from response');
      }
      
      const extractedQuestions = [];
      
      for (const block of questionBlocks) {
        // Extract question text
        const questionTextMatch = block.match(/"question_text":\s*"([^"]+)"/);
        const questionText = questionTextMatch ? questionTextMatch[1].replace(/\\"/g, '"') : '';
        
        // Extract image URL
        const imageUrlMatch = block.match(/"image_url":\s*"?([^",\}]+)"?/);
        const imageUrl = imageUrlMatch && imageUrlMatch[1] !== 'null' ? imageUrlMatch[1] : null;
        
        // Extract options
        const optionsMatches = block.match(/"value":\s*"([^"]+)"[\s\S]*?"label":\s*"([^"]+)"[\s\S]*?"is_correct":\s*(true|false)/g);
        
        const options = [];
        if (optionsMatches) {
          for (const optMatch of optionsMatches) {
            const valueMatch = optMatch.match(/"value":\s*"([^"]+)"/);
            const labelMatch = optMatch.match(/"label":\s*"([^"]+)"/);
            const isCorrectMatch = optMatch.match(/"is_correct":\s*(true|false)/);
            
            if (valueMatch && labelMatch && isCorrectMatch) {
              options.push({
                value: valueMatch[1],
                label: labelMatch[1].replace(/\\"/g, '"'),
                is_correct: isCorrectMatch[1] === 'true'
              });
            }
          }
        }
        
        if (questionText && options.length === 4) {
          extractedQuestions.push({
            question_text: questionText,
            image_url: imageUrl,
            options
          });
        }
      }
      
      return extractedQuestions;
    }
  } catch (error) {
    log.error(`Error extracting questions: ${error.message}`);
    return [];
  }
}

/**
 * Generate multiple new SAT questions based on an existing question using Google Gemini API
 * @param {Object} question - Original question object
 * @param {Number} count - Number of questions to generate
 * @returns {Array} - Array of generated question objects
 */
async function generateQuestions(question, count = 1) {
  try {
    log.progress(`Generating ${count} new questions based on question ID: ${question.id} (Difficulty: ${question.difficulty})`);
    
    // Create a prompt for Gemini
    const prompt = `
You are an expert SAT question creator. Create ${count} NEW and UNIQUE SAT ${question.subject} questions based on the following example:

Original Question: ${question.question_text}
Difficulty: ${question.difficulty}
Subject: ${question.subject}
Category: ${question.category}
Subcategory: ${question.subcategory}

Original Options:
${question.options.map(opt => `${opt.value}. ${opt.label} ${opt.is_correct ? '(Correct)' : ''}`).join('\n')}

Create ${count} new questions with the same pattern but different numbers/contexts. Each question must be unique and follow the style of the original question. Ensure one answer is correct for each question and the others are plausible distractors.

Format your response as a JSON array of objects with the following structure:
[
  {
    "question_text": "The new question text with math formatting using $ for inline math and $$ for display math",
    "image_url": null,
    "options": [
      {"value": "A", "label": "First option", "is_correct": true/false},
      {"value": "B", "label": "Second option", "is_correct": true/false},
      {"value": "C", "label": "Third option", "is_correct": true/false},
      {"value": "D", "label": "Fourth option", "is_correct": true/false}
    ]
  },
  {
    "question_text": "Another new question...",
    "image_url": null,
    "options": [...]
  },
  ...
]

IMPORTANT: When including dollar signs ($) in your JSON output, make sure they are properly escaped as \\$ to avoid JSON parsing errors. For example, "$5" should be written as "\\$5" in the JSON.

Ensure exactly one option is marked as correct for each question.
Make sure all ${count} questions are unique and follow the style of the original question.

Think step by step about how to create these questions. First, understand the pattern of the original question. Then, create new questions with different numbers or contexts while maintaining the same structure and difficulty level.
`;

    // Get the Gemini API key from environment variables
    const apiKey = "";
    log.info(`Using Gemini API key: ${apiKey.substring(0, 5)}...`);
    
    // Call Gemini API with retry logic
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
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
            temperature: 0.8,
            topP: 0.95,
            topK: 40
          }
        };

        log.progress(`Sending request to Gemini API (attempt ${attempts + 1}/${maxAttempts})...`);

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
          // If we get a 429 error (Too Many Requests), wait longer before retrying
          if (response.status === 429) {
            log.error(`Rate limit exceeded (429). Waiting longer before retry...`);
            // Wait for a longer time (15 seconds) before retrying
            await new Promise(resolve => setTimeout(resolve, 15000));
            throw new Error(`Gemini API rate limit exceeded: ${JSON.stringify(responseData)}`);
          } else {
            throw new Error(`Gemini API error: ${JSON.stringify(responseData)}`);
          }
        }
        
        // Extract the generated content
        const generatedContent = responseData.candidates[0].content.parts[0].text;
        log.info(`Received response from Gemini: ${generatedContent.substring(0, 50)}...`);
        
        // Extract questions using our custom function
        log.progress(`Extracting questions from Gemini response...`);
        const extractedQuestions = extractQuestionsFromResponse(generatedContent);
        
        // Validate that we have the expected number of questions
        if (!Array.isArray(extractedQuestions) || extractedQuestions.length === 0) {
          throw new Error('No questions were extracted from the response');
        }
        
        log.progress(`Successfully extracted ${extractedQuestions.length} questions`);
        
        // Validate that each question has the required fields
        for (const q of extractedQuestions) {
          if (!q.question_text || !Array.isArray(q.options) || q.options.length !== 4) {
            throw new Error('Extracted question has invalid structure');
          }
          
          // Ensure exactly one option is marked as correct
          const correctOptions = q.options.filter(opt => opt.is_correct);
          if (correctOptions.length !== 1) {
            throw new Error('Question does not have exactly one correct option');
          }
        }
        
        // Add metadata to each question - ensure difficulty is correctly inherited from template
        const generatedQuestionsWithMetadata = extractedQuestions.map(q => {
          const questionWithMetadata = {
            ...q,
            difficulty: question.difficulty, // Explicitly preserve the difficulty from the template question
            subject: question.subject,
            category: question.category,
            subcategory: question.subcategory,
            subject_id: question.subject_id,
            category_id: question.category_id,
            subcategory_id: question.subcategory_id,
            id: Math.floor(Math.random() * 1000000) // Generate a random ID
          };
          
          // Log the difficulty of each generated question for verification
          log.info(`Generated question with difficulty: ${questionWithMetadata.difficulty}`);
          
          return questionWithMetadata;
        });
        
        // Add a delay after successful API call to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        return generatedQuestionsWithMetadata;
      } catch (apiError) {
        log.error(`API Error: ${apiError.message}`);
        attempts++;
        if (attempts >= maxAttempts) {
          return [];
        }
        log.info(`Retrying (attempt ${attempts + 1}/${maxAttempts})...`);
        // Wait longer between retries (10 seconds)
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    return [];
  } catch (error) {
    log.error(`Error generating questions: ${error.message}`);
    return [];
  }
}

/**
 * Save generated questions and options to JSON files
 * @param {Array} questions - Array of generated questions
 * @param {Number} subcategoryId - Subcategory ID for file naming
 */
async function saveToJson(questions, subcategoryId) {
  try {
    if (questions.length === 0) {
      log.error(`No questions to save for subcategory ${subcategoryId}`);
      return;
    }
    
    // Log difficulty distribution for verification
    const difficultyCount = {
      Easy: 0,
      Medium: 0,
      Hard: 0,
      Other: 0
    };
    
    questions.forEach(q => {
      if (q.difficulty === 'Easy') difficultyCount.Easy++;
      else if (q.difficulty === 'Medium') difficultyCount.Medium++;
      else if (q.difficulty === 'Hard') difficultyCount.Hard++;
      else difficultyCount.Other++;
    });
    
    log.info(`Difficulty distribution for subcategory ${subcategoryId}:`);
    log.info(`Easy: ${difficultyCount.Easy}, Medium: ${difficultyCount.Medium}, Hard: ${difficultyCount.Hard}, Other: ${difficultyCount.Other}`);
    
    // Prepare questions and options arrays
    const questionsJson = questions.map(q => ({
      id: q.id,
      question_text: q.question_text,
      image_url: q.image_url,
      difficulty: q.difficulty,
      subject: q.subject,
      category: q.category,
      subcategory: q.subcategory,
      subject_id: q.subject_id,
      category_id: q.category_id,
      subcategory_id: q.subcategory_id
    }));
    
    // Prepare options array
    const optionsJson = [];
    questions.forEach(q => {
      q.options.forEach((opt, index) => {
        optionsJson.push({
          id: q.id * 10 + index,
          question_id: q.id,
          value: opt.value,
          label: opt.label,
          is_correct: opt.is_correct
        });
      });
    });
    
    // Create output directory if it doesn't exist
    const outputDir = join(__dirname, '../generated');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Write to JSON files
    await fs.writeFile(
      join(outputDir, `questions-${subcategoryId}.json`),
      JSON.stringify(questionsJson, null, 2)
    );
    
    await fs.writeFile(
      join(outputDir, `options-${subcategoryId}.json`),
      JSON.stringify(optionsJson, null, 2)
    );
    
    log.success(`Successfully saved ${questions.length} questions to JSON files for subcategory ${subcategoryId}`);
  } catch (error) {
    log.error(`Error saving to JSON for subcategory ${subcategoryId}: ${error.message}`);
  }
}

/**
 * Find all markdown files in the question bank
 * @returns {Array} - Array of file paths
 */
async function findAllMarkdownFiles() {
  try {
    const markdownDir = join(__dirname, '../sat-parser/sat-question-bank/markdown');
    const allFiles = [];
    
    // Function to recursively search for markdown files
    async function searchDirectory(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await searchDirectory(fullPath);
        } else if (entry.name.endsWith('~Key.md')) {
          allFiles.push(fullPath);
        }
      }
    }
    
    await searchDirectory(markdownDir);
    return allFiles;
  } catch (error) {
    log.error(`Error finding markdown files: ${error.message}`);
    return [];
  }
}

/**
 * Main function to run the script
 */
async function main() {
  try {
    log.info('Starting SAT question generation process...');
    
    // Find all markdown files
    const allMarkdownFiles = await findAllMarkdownFiles();
    log.info(`Found ${allMarkdownFiles.length} markdown files to process`);
    
    // Group files by subcategory
    const filesBySubcategory = {};
    
    for (const filePath of allMarkdownFiles) {
      const metadata = getMetadataFromPath(filePath);
      const key = `${metadata.subcategory_id}`;
      
      if (!filesBySubcategory[key]) {
        filesBySubcategory[key] = [];
      }
      
      filesBySubcategory[key].push(filePath);
    }
    
    // Get subcategory IDs and sort them numerically
    const subcategoryIds = Object.keys(filesBySubcategory).sort((a, b) => parseInt(a) - parseInt(b));
    
    // Filter to only include subcategory IDs >= 37
    const filteredSubcategoryIds = subcategoryIds.filter(id => parseInt(id) >= 37);
    
    log.info(`Starting from subcategory 37. Will process these subcategories: ${filteredSubcategoryIds.join(', ')}`);
    
    // Process each subcategory starting from 37
    for (const subcategoryId of filteredSubcategoryIds) {
      const filePaths = filesBySubcategory[subcategoryId];
      
      if (subcategoryId === '0') {
        log.error(`Skipping files with unknown subcategory ID`);
        continue;
      }
      
      log.info(`Processing subcategory ID: ${subcategoryId} (${filePaths.length} files)`);
      
      // Parse all files for this subcategory
      const allQuestions = [];
      
      for (const filePath of filePaths) {
        log.progress(`Parsing file: ${path.basename(filePath)}`);
        const questions = await parseMarkdownFile(filePath);
        
        if (questions.length > 0) {
          allQuestions.push(...questions);
          log.info(`Added ${questions.length} questions from ${path.basename(filePath)}`);
        } else {
          log.error(`No questions found in ${path.basename(filePath)}`);
        }
      }
      
      if (allQuestions.length === 0) {
        log.error(`No questions found for subcategory ${subcategoryId}, skipping`);
        continue;
      }
      
      // Generate new questions based on parsed questions
      const generatedQuestions = [];
      // Generate 1 question per template instead of a fixed number
      const questionsPerTemplate = 1;
      
      // Remove the template limit to process all questions from the file
      const templates = allQuestions;
      
      log.info(`Using ${templates.length} templates to generate questions for subcategory ${subcategoryId}`);
      
      for (const templateQuestion of templates) {
        if (templateQuestion && templateQuestion.id) {
          log.progress(`Generating ${questionsPerTemplate} question based on template ID: ${templateQuestion.id} (Difficulty: ${templateQuestion.difficulty})`);
          
          const newQuestions = await generateQuestions(templateQuestion, questionsPerTemplate);
          generatedQuestions.push(...newQuestions);
          
          // Save progress after each template to avoid losing work if interrupted
          if (newQuestions.length > 0) {
            await saveToJson([...generatedQuestions], subcategoryId);
            log.progress(`Progress saved: ${generatedQuestions.length} questions generated so far for subcategory ${subcategoryId}`);
          }
          
          // Add a delay between template questions to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      log.info(`Generated ${generatedQuestions.length} new questions for subcategory ${subcategoryId}`);
      
      // Final save of all generated questions for this subcategory
      await saveToJson(generatedQuestions, subcategoryId);
      
      // Add a longer delay between subcategories to avoid rate limiting
      log.info(`Waiting 30 seconds before processing next subcategory to avoid rate limiting...`);
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
    
    log.success('Question generation process completed successfully!');
  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error); 