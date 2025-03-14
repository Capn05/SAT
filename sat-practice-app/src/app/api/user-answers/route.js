import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (!session || sessionError) {
      console.error('Auth session missing or error:', sessionError);
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, { status: 401 });
    }

    const { questionId, optionId, isCorrect, subject, mode } = await request.json();
    console.log('Processing answer:', { questionId, optionId, isCorrect, subject, mode });

    // Get question details to get domain and subcategory info
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select(`
        *,
        domains!inner (
          id,
          domain_name
        ),
        subcategories!inner (
          id,
          subcategory_name
        )
      `)
      .eq('id', questionId)
      .single();

    if (questionError) {
      console.error('Error fetching question:', questionError);
      return NextResponse.json({ error: 'Failed to fetch question details' }, { status: 500 });
    }

    // Record the user's answer
    const { error: answerError } = await supabase
      .from('user_answers')
      .insert({
        user_id: session.user.id,
        question_id: questionId,
        selected_option_id: optionId,
        is_correct: isCorrect,
        practice_type: mode,
        test_id: null,
        answered_at: new Date().toISOString()
      });

    if (answerError) {
      console.error('Error recording answer:', answerError);
      return NextResponse.json({ error: 'Failed to record answer' }, { status: 500 });
    }

    // Get user's current skill analytics for this subcategory
    const { data: currentAnalytics, error: analyticsError } = await supabase
      .from('user_skill_analytics')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('subcategory_id', question.subcategory_id)
      .single();

    // Calculate new mastery level
    let total_attempts = 1;
    let correct_attempts = isCorrect ? 1 : 0;

    if (currentAnalytics) {
      total_attempts = currentAnalytics.total_attempts + 1;
      correct_attempts = currentAnalytics.correct_attempts + (isCorrect ? 1 : 0);
    }

    const accuracy = (correct_attempts / total_attempts) * 100;
    let mastery_level;
    if (accuracy < 60) mastery_level = 'Needs Practice';
    else if (accuracy < 80) mastery_level = 'Needs More Attempts';
    else if (accuracy < 90) mastery_level = 'On Track';
    else mastery_level = 'Mastered';

    // Update user_skill_analytics
    const { error: updateError } = await supabase
      .from('user_skill_analytics')
      .upsert({
        user_id: session.user.id,
        subject_id: question.subject_id,
        domain_id: question.domain_id,
        subcategory_id: question.subcategory_id,
        total_attempts,
        correct_attempts,
        last_practiced: new Date().toISOString(),
        mastery_level
      }, {
        onConflict: ['user_id', 'subcategory_id']
      });

    if (updateError) {
      console.error('Error updating analytics:', updateError);
      return NextResponse.json({ error: 'Failed to update skill analytics' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      mastery_level,
      accuracy: Math.round(accuracy)
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
} 