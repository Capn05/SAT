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
      .eq('id', question_id)
      .single();

    if (questionError) {
      console.error('Error fetching question details:', questionError);
      return NextResponse.json({ error: 'Failed to fetch question details' }, { status: 500 });
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

    // After recording the answer, update the user's skill analytics
    
    // Get user's current skill analytics for this subcategory
    const { data: currentAnalytics, error: analyticsError } = await supabase
      .from('user_skill_analytics')
      .select('*')
      .eq('user_id', user_id)
      .eq('subcategory_id', question.subcategory_id)
      .single();

    // Calculate new mastery level using the same logic as refresh-skills-cache
    let total_attempts = 1;
    let correct_attempts = is_correct ? 1 : 0;

    if (currentAnalytics) {
      total_attempts = currentAnalytics.total_attempts + 1;
      correct_attempts = currentAnalytics.correct_attempts + (is_correct ? 1 : 0);
    }

    const accuracy = (correct_attempts / total_attempts) * 100;
    let mastery_level;
    
    // Use consistent mastery level logic across the app
    if (total_attempts === 0) {
      mastery_level = 'Not Started';
    } else if (total_attempts < 5) {
      mastery_level = 'Needs More Attempts';
    } else if (accuracy >= 85) {
      mastery_level = 'Mastered';
    } else if (accuracy >= 60) {
      mastery_level = 'Improving';
    } else {
      mastery_level = 'Needs Work';
    }

    // Update user_skill_analytics
    const { error: updateError } = await supabase
      .from('user_skill_analytics')
      .upsert({
        user_id: user_id,
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

    console.log('Successfully saved answer and updated analytics:', {
      answer: data,
      mastery_level,
      accuracy: Math.round(accuracy)
    });
    
    return NextResponse.json({ 
      success: true, 
      mastery_level,
      accuracy: Math.round(accuracy)
    }, { status: 200 });

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