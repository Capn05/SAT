import { supabase } from '../../../../lib/supabase';

export async function POST(req) {
  const { userId, questionId, optionId, isCorrect } = await req.json(); // Parse the JSON body

  const { data, error } = await supabase
    .from('user_answers')
    .upsert([
      {
        user_id: userId,          // Replace with authenticated user's ID
        question_id: questionId,  // ID of the answered question
        option_id: optionId,      // ID of the selected option
        is_correct: isCorrect,     // Boolean, true if correct
        answered_at: new Date()    // Current timestamp
      }
    ], { onConflict: ['user_id', 'question_id'] }); // Ensure conflict is handled

  if (error) {
    console.error('Error inserting or updating user answer:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  return new Response(JSON.stringify(data), { status: 200 });
} 