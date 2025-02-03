import { supabase } from '../../../../lib/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const testId = searchParams.get('testId');

  if (!testId) {
    return new Response(JSON.stringify({ error: 'Test ID is required' }), { status: 400 });
  }

  try {
    // Step 1: Fetch questions for the given testId
    const { data: questions, error: questionsError } = await supabase
      .from('official_questions')
      .select('*')
      .eq('test_id', testId);

    if (questionsError) {
      throw new Error(`Error fetching questions: ${questionsError.message}`);
    }

    // Step 2: Fetch options for the fetched questions
    const questionsWithOptions = await Promise.all(questions.map(async (question) => {
      const { data: options, error: optionsError } = await supabase
        .from('official_options')
        .select('*')
        .eq('question_id', question.id);

      if (optionsError) {
        throw new Error(`Error fetching options for question ${question.id}: ${optionsError.message}`);
      }

      // Step 3: Return question with its options
      return {
        ...question,
        options: options.map(option => ({
          id: option.id,
          text: option.label, // Assuming 'label' is the text for the option
          isCorrect: option.is_correct, // Assuming 'is_correct' indicates the correct answer
          value: option.value
        }))
      };
    }));

    return new Response(JSON.stringify(questionsWithOptions), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}