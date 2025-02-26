import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Get the directory path of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local in the root directory
dotenv.config({ path: join(__dirname, '../.env.local') });

// Initialize OpenAI with the API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY_2,
  dangerouslyAllowBrowser: true
});

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
 * Generate a new SAT question based on an existing question using OpenAI
 * @param {Object} question - Original question object
 * @returns {Object} - Generated question object
 */
async function generateQuestion(question) {
  try {
    log.progress(`Generating new question based on question ID: ${question.id}`);
    
    // Create a prompt for OpenAI
    const prompt = `
You are an expert SAT question creator. Create a new SAT Math question based on the following example:

Original Question: ${question.question_text}
Difficulty: ${question.difficulty}
Subject: ${question.subject}
Category: ${question.category}
Subcategory: ${question.subcategory}

Original Options:
${question.options.map(opt => `${opt.value}. ${opt.label} ${opt.is_correct ? '(Correct)' : ''}`).join('\n')}

Create a new question with the same pattern but different numbers/context. Ensure one answer is correct and the others are plausible distractors.

Format your response as a JSON object with the following structure:
{
  "question_text": "The new question text with math formatting using $ for inline math and $$ for display math",
  "image_url": null,
  "options": [
    {"value": "A", "label": "First option", "is_correct": true/false},
    {"value": "B", "label": "Second option", "is_correct": true/false},
    {"value": "C", "label": "Third option", "is_correct": true/false},
    {"value": "D", "label": "Fourth option", "is_correct": true/false}
  ]
}

Ensure exactly one option is marked as correct.
`;

    log.info(`Using API key: ${process.env.OPENAI_API_KEY_2.substring(0, 5)}...`);
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert SAT question creator." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    // Parse the response
    const generatedContent = response.choices[0].message.content;
    log.info(`Received response from OpenAI: ${generatedContent.substring(0, 50)}...`);
    
    const jsonMatch = generatedContent.match(/```json\n([\s\S]*?)\n```/) || 
                      generatedContent.match(/{[\s\S]*?}/);
    
    let jsonContent;
    if (jsonMatch) {
      jsonContent = jsonMatch[1] || jsonMatch[0];
    } else {
      jsonContent = generatedContent;
    }
    
    try {
      const generatedQuestion = JSON.parse(jsonContent);
      
      // Add metadata
      generatedQuestion.difficulty = question.difficulty;
      generatedQuestion.subject = SUBJECT_NAME;
      generatedQuestion.category = CATEGORY_NAME;
      generatedQuestion.subcategory = SUBCATEGORY_NAME;
      generatedQuestion.subject_id = SUBJECT_ID;
      generatedQuestion.category_id = CATEGORY_ID;
      generatedQuestion.subcategory_id = SUBCATEGORY_ID;
      generatedQuestion.id = Math.floor(Math.random() * 1000000); // Generate a random ID
      
      return generatedQuestion;
    } catch (parseError) {
      log.error(`Error parsing JSON response: ${parseError.message}`);
      log.error(`Raw response: ${generatedContent}`);
      return null;
    }
  } catch (error) {
    log.error(`Error generating question: ${error.message}`);
    if (error.response) {
      log.error(`API Error details: ${JSON.stringify(error.response)}`);
    }
    return null;
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
      join(markdownDir, 'Systems of Linear Equations 1~Key.md'),
      join(markdownDir, 'Systems of Linear Equations 2~Key.md'),
      join(markdownDir, 'Systems of Linear Equations 3~Key.md')
    ];
    
    // Parse all markdown files
    const allQuestions = [];
    for (const filePath of filePaths) {
      log.progress(`Parsing file: ${path.basename(filePath)}`);
      const questions = await parseMarkdownFile(filePath);
      // Only take the first 3 questions from each file for testing
      allQuestions.push(...questions.slice(0, 3));
    }
    
    log.info(`Parsed ${allQuestions.length} questions from markdown files`);
    
    // Generate new questions based on parsed questions
    const generatedQuestions = [];
    for (const question of allQuestions) {
      // Generate only 1 question per original question for testing
      const generatedQuestion = await generateQuestion(question);
      if (generatedQuestion) {
        generatedQuestions.push(generatedQuestion);
      }
    }
    
    log.info(`Generated ${generatedQuestions.length} new questions`);
    
    // Save generated questions to JSON files
    await saveToJson(generatedQuestions);
    
    log.success('Question generation process completed successfully!');
  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error); 