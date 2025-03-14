import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }
    
    if (!session?.user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    const user_id = session.user.id;
    const requestData = await request.json();
    
    const { 
      question_id, 
      selected_option_id, 
      is_correct,
      test_id 
    } = requestData;
    
    if (!question_id || !selected_option_id || is_correct === undefined || !test_id) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }
    
    // Record the answer
    const { data, error } = await supabase
      .from('user_answers')
      .insert({
        user_id,
        question_id,
        selected_option_id,
        is_correct,
        practice_type: 'test',
        test_id,
        answered_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error recording answer:', error);
      return NextResponse.json({ error: 'Failed to record answer' }, { status: 500 });
    }
    
    // Successful response
    return NextResponse.json({
      success: true,
      answer_id: data.id
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 