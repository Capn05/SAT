import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Initialize OpenAI and Supabase clients
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPEN_AI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const mathCategories = {
  'Algebra': {
    'Linear Equations': {
      description: 'Questions involving linear equations, solving for variables, and understanding linear relationships.',
      example: 'Solve for x in the equation 3x + 5 = 14'
    },
    'Systems of Equations': {
      description: 'Questions involving multiple equations that need to be solved simultaneously.',
      example: 'Solve the system of equations: y = 2x + 1 and y = -x + 7'
    }
  },
  'Advanced Math': {
    'Quadratic Equations': {
      description: 'Questions involving quadratic equations, parabolas, and finding roots.',
      example: 'Find the solutions to x² + 5x + 6 = 0'
    },
    'Exponential Functions': {
      description: 'Questions involving exponential growth/decay and exponential functions.',
      example: 'If a population grows exponentially and doubles every 3 years, what is its growth rate?'
    }
  },
  'Problem Solving': {
    'Geometry & Trigonometry': {
      description: 'Questions involving geometric shapes, angles, trigonometric ratios, and spatial reasoning.',
      example: 'Find the area of a triangle with base 6 and height 8'
    },
    'Data Analysis': {
      description: 'Questions involving interpreting data, statistics, graphs, and probability.',
      example: 'Given a dataset, find the mean, median, and mode'
    }
  }
};

async function generateQuestion(mainCategory, subcategory) {
  const prompt = `Create a SAT-style math question for the category "${mainCategory}" and subcategory "${subcategory}".
  Use the following description as a guide: ${mathCategories[mainCategory][subcategory].description}

  The question should:
  1. Be appropriate for SAT difficulty level
  2. Include mathematical notation using LaTeX (e.g., $x^2$ for x squared)
  3. Have exactly 4 answer choices (A, B, C, D)
  4. Include a clear explanation for the correct answer
  5. If relevant, include a graph or diagram description

  IMPORTANT: Ensure the response is valid JSON with no control characters or special formatting.
  Use simple quotes for strings and escape any special characters.

  Return the response in this exact JSON format:
  {
    "question_text": "The question text with LaTeX notation where needed",
    "options": [
      {"value": "A", "label": "First option", "is_correct": true},
      {"value": "B", "label": "Second option", "is_correct": false},
      {"value": "C", "label": "Third option", "is_correct": false},
      {"value": "D", "label": "Fourth option", "is_correct": false}
    ],
    "explanation": "Detailed explanation of the correct answer"
  }`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "You are an expert SAT math question creator. Create challenging but fair questions that test understanding of mathematical concepts. Always return valid JSON with properly escaped strings."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7
    });

    const content = response.choices[0].message.content;
    
    // Clean the response string
    const cleanContent = content
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\n/g, ' ')  // Replace newlines with spaces
      .trim();

    try {
      const questionData = JSON.parse(cleanContent);
      
      // Validate the structure
      if (!questionData.question_text || !Array.isArray(questionData.options) || questionData.options.length !== 4) {
        throw new Error('Invalid question data structure');
      }

      return questionData;
    } catch (parseError) {
      console.error('Failed to parse response:', cleanContent);
      throw parseError;
    }
  } catch (error) {
    console.error('Error generating question:', error);
    throw error;
  }
}

async function uploadQuestion(questionData, mainCategory, subcategory) {
  try {
    // Insert the question
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .insert([{
        question_text: questionData.question_text,
        subject_id: 1, // Math
        subject: 'Math',
        main_category: mainCategory,
        subcategory: subcategory,
        difficulty: 'medium'
      }])
      .select()
      .single();

    if (questionError) throw questionError;

    // Insert the options
    const optionsToInsert = questionData.options.map(option => ({
      question_id: question.id,
      value: option.value,
      label: option.label,
      is_correct: option.is_correct
    }));

    const { error: optionsError } = await supabase
      .from('options')
      .insert(optionsToInsert);

    if (optionsError) throw optionsError;

    console.log(`Successfully uploaded question for ${mainCategory} - ${subcategory}`);
    return true;
  } catch (error) {
    console.error('Error uploading question:', error);
    return false;
  }
}

async function getExistingQuestionCounts() {
  const { data, error } = await supabase
    .from('questions')
    .select('main_category, subcategory')
    .eq('subject', 'Math');

  if (error) {
    console.error('Error getting existing question counts:', error);
    return {};
  }

  // Count questions manually since we can't use group_by
  const counts = data.reduce((acc, row) => {
    if (!acc[row.main_category]) {
      acc[row.main_category] = {};
    }
    if (!acc[row.main_category][row.subcategory]) {
      acc[row.main_category][row.subcategory] = 0;
    }
    acc[row.main_category][row.subcategory]++;
    return acc;
  }, {});

  return counts;
}

async function generateQuestionsForCategory(mainCategory, subcategory, count) {
  console.log(`\n=== Generating ${count} questions for ${mainCategory} - ${subcategory} ===`);
  
  for (let i = 0; i < count; i++) {
    try {
      console.log(`\nGenerating question ${i + 1} of ${count} for ${subcategory}...`);
      const questionData = await generateQuestion(mainCategory, subcategory);
      await uploadQuestion(questionData, mainCategory, subcategory);
      // Add a small delay between questions to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Failed to generate question ${i + 1} for ${subcategory}:`, error);
      // Wait a bit longer if there's an error
      await new Promise(resolve => setTimeout(resolve, 5000));
      // Try this question again
      i--;
    }
  }
}

async function main() {
  // Target counts for each category
  const targetCounts = {
    'Advanced Math': {
      'Quadratic Equations': 10,
      'Exponential Functions': 10
    },
    'Algebra': {
      'Systems of Equations': 10
    },
    'Problem Solving': {
      'Geometry & Trigonometry': 10,
      'Data Analysis': 10
    }
  };

  // Get current counts
  console.log('Checking existing question counts...');
  const existingCounts = await getExistingQuestionCounts();
  console.log('Current question counts:', JSON.stringify(existingCounts, null, 2));

  // Calculate how many questions we need to generate
  const questionsNeeded = {};
  for (const [mainCategory, subcategories] of Object.entries(targetCounts)) {
    questionsNeeded[mainCategory] = {};
    for (const [subcategory, targetCount] of Object.entries(subcategories)) {
      const existingCount = existingCounts[mainCategory]?.[subcategory] || 0;
      const neededCount = Math.max(0, targetCount - existingCount);
      if (neededCount > 0) {
        questionsNeeded[mainCategory][subcategory] = neededCount;
      }
    }
  }

  console.log('\nQuestions needed:', JSON.stringify(questionsNeeded, null, 2));

  // Generate questions where needed
  for (const [mainCategory, subcategories] of Object.entries(questionsNeeded)) {
    for (const [subcategory, count] of Object.entries(subcategories)) {
      if (count > 0) {
        await generateQuestionsForCategory(mainCategory, subcategory, count);
      }
    }
  }

  // Final count check
  const finalCounts = await getExistingQuestionCounts();
  console.log('\nFinal question counts:', JSON.stringify(finalCounts, null, 2));
  console.log('\nQuestion generation completed!');
}

main().catch(console.error);