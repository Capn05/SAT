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

// Constants for subject, category, and subcategory mapping
const SUBJECT_ID = 1; // Math
const CATEGORY_ID = 2; // Algebra
const SUBCATEGORY_ID = 18; // Systems of Linear Equations
const SUBJECT_NAME = 'Math';
const CATEGORY_NAME = 'Algebra';
const SUBCATEGORY_NAME = 'Systems of Linear Equations';

// Logging utility
const log = {
  info: (message) => console.log(`[INFO] ${message}`),
  error: (message) => console.error(`[ERROR] ${message}`),
  success: (message) => console.log(`[SUCCESS] ${message}`),
  progress: (message) => console.log(`[PROGRESS] ${message}`)
};

/**
 * Read and parse a markdown file containing SAT questions
 * @param {string} filePath - Path to the markdown file
 * @returns {Array} - Array of parsed questions
 */
async function parseMarkdownFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Split the content by question delimiter
    const questions = content.split('{').filter(Boolean).map(q => `{${q}`);
    
    // Parse each question
    const parsedQuestions = questions.map(questionText => {
      // Extract question ID
      const idMatch = questionText.match(/ID: ([a-f0-9]+)/);
      const id = idMatch ? idMatch[1] : null;
      
      // Extract difficulty level
      const difficultyMatch = questionText.match(/Question Difficulty: (Easy|Medium|Hard)/i);
      const difficulty = difficultyMatch ? difficultyMatch[1] : 'Medium'; // Default to Medium if not found
      
      // Extract question text
      const questionTextMatch = questionText.match(/\n(.*?)\n[A-D]\./s);
      const questionContent = questionTextMatch ? questionTextMatch[1].trim() : '';
      
      // Extract answer options
      const optionsMatch = questionText.match(/([A-D]\. .*?)(?=[A-D]\.|ID:|$)/gs);
      const options = optionsMatch ? optionsMatch.map(option => {
        const value = option.substring(0, 1);
        const label = option.substring(3).trim();
        return { value, label };
      }) : [];
      
      // Extract correct answer
      const correctAnswerMatch = questionText.match(/Correct Answer: ([A-D])/);
      const correctAnswer = correctAnswerMatch ? correctAnswerMatch[1] : null;
      
      // Mark correct option
      options.forEach(option => {
        option.is_correct = option.value === correctAnswer;
      });
      
      // Extract image URL if present
      const imageMatch = questionText.match(/!\[\]\((.*?)\)/);
      const imageUrl = imageMatch ? imageMatch[1] : null;
      
      return {
        id,
        question_text: questionContent,
        image_url: imageUrl,
        difficulty,
        options,
        subject: SUBJECT_NAME,
        category: CATEGORY_NAME,
        subcategory: SUBCATEGORY_NAME,
        subject_id: SUBJECT_ID,
        category_id: CATEGORY_ID,
        subcategory_id: SUBCATEGORY_ID
      };
    });
    
    return parsedQuestions;
  } catch (error) {
    log.error(`Error parsing markdown file ${filePath}: ${error.message}`);
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
    log.progress(`Generating ${count} new questions based on question ID: ${question.id}`);
    
    // Create a prompt for Gemini
    const prompt = `
You are an expert SAT question creator. Create ${count} NEW and UNIQUE SAT Math questions based on the following example:

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

Ensure exactly one option is marked as correct for each question.
Make sure all ${count} questions are unique and follow the style of the original question.

Think step by step about how to create these questions. First, understand the pattern of the original question. Then, create new questions with different numbers or contexts while maintaining the same structure and difficulty level.
`;

    // Get the Gemini API key from environment variables
    const apiKey = process.env.GEMINI_API_KEY;
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

        // Make the API request to Gemini
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
        log.info(`Received response from Gemini: ${generatedContent.substring(0, 50)}...`);
        
        // Extract JSON from the response
        const jsonMatch = generatedContent.match(/```json\n([\s\S]*?)\n```/) || 
                          generatedContent.match(/```\n([\s\S]*?)\n```/) ||
                          generatedContent.match(/\[\s*\{[\s\S]*\}\s*\]/);
        
        let jsonContent;
        if (jsonMatch) {
          jsonContent = jsonMatch[1] || jsonMatch[0];
        } else {
          jsonContent = generatedContent;
        }
        
        try {
          const generatedQuestions = JSON.parse(jsonContent);
          
          // Validate that we have the expected number of questions
          if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
            throw new Error('No questions were generated or invalid format');
          }
          
          // Validate that each question has the required fields
          for (const q of generatedQuestions) {
            if (!q.question_text || !Array.isArray(q.options) || q.options.length !== 4) {
              throw new Error('Generated question has invalid structure');
            }
            
            // Ensure exactly one option is marked as correct
            const correctOptions = q.options.filter(opt => opt.is_correct);
            if (correctOptions.length !== 1) {
              throw new Error('Question does not have exactly one correct option');
            }
          }
          
          // Add metadata to each question
          return generatedQuestions.map(q => {
            return {
              ...q,
              difficulty: question.difficulty,
              subject: SUBJECT_NAME,
              category: CATEGORY_NAME,
              subcategory: SUBCATEGORY_NAME,
              subject_id: SUBJECT_ID,
              category_id: CATEGORY_ID,
              subcategory_id: SUBCATEGORY_ID,
              id: Math.floor(Math.random() * 1000000) // Generate a random ID
            };
          });
        } catch (parseError) {
          log.error(`Error parsing JSON response: ${parseError.message}`);
          log.error(`Raw response: ${generatedContent}`);
          attempts++;
          if (attempts >= maxAttempts) {
            return [];
          }
          log.info(`Retrying (attempt ${attempts + 1}/${maxAttempts})...`);
        }
      } catch (apiError) {
        log.error(`API Error: ${apiError.message}`);
        attempts++;
        if (attempts >= maxAttempts) {
          return [];
        }
        log.info(`Retrying (attempt ${attempts + 1}/${maxAttempts})...`);
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
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
 */
async function saveToJson(questions) {
  try {
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
      join(outputDir, `questions-${SUBCATEGORY_ID}.json`),
      JSON.stringify(questionsJson, null, 2)
    );
    
    await fs.writeFile(
      join(outputDir, `options-${SUBCATEGORY_ID}.json`),
      JSON.stringify(optionsJson, null, 2)
    );
    
    log.success(`Successfully saved ${questions.length} questions to JSON files`);
  } catch (error) {
    log.error(`Error saving to JSON: ${error.message}`);
  }
}

/**
 * Main function to run the script
 */
async function main() {
  try {
    log.info('Starting SAT question generation process...');
    
    // Define paths to the markdown files
    const markdownDir = join(__dirname, '../sat-parser/sat-question-bank/markdown/Math/Algebra');
    const filePaths = [
      join(markdownDir, 'Systems of Linear Equations 1~Key.md'), // Easy difficulty
      join(markdownDir, 'Systems of Linear Equations 2~Key.md'), // Medium difficulty
      join(markdownDir, 'Systems of Linear Equations 3~Key.md')  // Hard difficulty
    ];
    
    // Parse all markdown files
    const allQuestions = [];
    const fileQuestions = [];
    
    for (const filePath of filePaths) {
      log.progress(`Parsing file: ${path.basename(filePath)}`);
      const questions = await parseMarkdownFile(filePath);
      
      // Store questions by file for batch processing
      if (questions.length > 0) {
        fileQuestions.push({
          filePath: path.basename(filePath),
          questions: questions.slice(0, 7) // Take first 7 questions as templates from each file
        });
      }
    }
    
    // Generate new questions based on parsed questions
    const generatedQuestions = [];
    
    for (const fileData of fileQuestions) {
      log.info(`Processing questions from ${fileData.filePath}`);
      
      // Generate 3 questions from each template to get approximately 20 questions per file
      for (const templateQuestion of fileData.questions) {
        if (templateQuestion && templateQuestion.id) {
          log.progress(`Generating 3 questions based on template ID: ${templateQuestion.id}`);
          // Generate 3 questions based on this template
          const newQuestions = await generateQuestions(templateQuestion, 3);
          generatedQuestions.push(...newQuestions);
          
          // Save progress after each template to avoid losing work if interrupted
          if (newQuestions.length > 0) {
            await saveToJson([...generatedQuestions]);
            log.info(`Progress saved: ${generatedQuestions.length} questions generated so far`);
          }
        }
      }
    }
    
    log.info(`Generated ${generatedQuestions.length} new questions in total`);
    
    // Final save of all generated questions
    await saveToJson(generatedQuestions);
    
    log.success('Question generation process completed successfully!');
  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error); 