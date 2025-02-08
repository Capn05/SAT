import { supabase } from '../../../../lib/supabase';
import { NextResponse } from 'next/server';

// Add export for POST method
export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Received request body:', body);

    const { user_id, question_id, option_id, is_correct, test_id } = body;

    // Validate required fields
    if (!user_id || !question_id || !option_id || !test_id) {
      console.error('Missing required fields:', { user_id, question_id, option_id, test_id });
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('official_user_answers')
      .upsert([
        {
          user_id,
          question_id,
          option_id,
          is_correct,
          test_id,
          answered_at: new Date().toISOString()
        }
      ], {
        onConflict: ['user_id', 'question_id']
      });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }

    console.log('Successfully saved answer:', data);
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}