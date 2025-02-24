import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const category = searchParams.get('category');

    console.log('Fetching questions with params:', { subject, category });

    if (!subject || !category) {
      return NextResponse.json({ error: 'Subject and category are required' }, { status: 400 });
    }

    // Get exactly 5 questions that match the specific category
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*, options(*)')
      .eq('subject_id', subject)
      .eq('subcategory', category)  // Only get questions for this specific subcategory
      .limit(5);

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json({ 
        error: 'Failed to fetch questions',
        details: questionsError
      }, { status: 500 });
    }

    if (!questions || questions.length === 0) {
      console.log('No questions found');
      return NextResponse.json({ 
        questions: [],
        message: 'No questions available for this category' 
      });
    }

    if (questions.length < 5) {
      console.log(`Warning: Only ${questions.length} questions available for category ${category}`);
    }

    // Shuffle the options for each question
    const shuffledQuestions = questions.map(q => ({
      ...q,
      options: q.options.sort(() => Math.random() - 0.5)
    }));

    console.log(`Returning ${shuffledQuestions.length} questions for category ${category}`);
    
    return NextResponse.json({ questions: shuffledQuestions });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    const { questionId, selectedAnswerId, isCorrect } = body;

    // Get question details for updating skill performance
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('subject_id, main_category, subcategory')
      .eq('id', questionId)
      .single();

    if (questionError) {
      console.error('Error fetching question:', questionError);
      return NextResponse.json({ error: 'Failed to fetch question details' }, { status: 500 });
    }

    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Record the user's answer
    const { error: answerError } = await supabase
      .from('user_answers')
      .insert({
        user_id: session.user.id,
        question_id: questionId,
        selected_answer_id: selectedAnswerId,
        is_correct: isCorrect
      });

    if (answerError) {
      console.error('Error recording answer:', answerError);
      return NextResponse.json({ error: 'Failed to record answer' }, { status: 500 });
    }

    // Update skill performance
    const { data: performance, error: performanceError } = await supabase
      .from('skill_performance')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('subject_id', question.subject_id)
      .eq('main_category', question.main_category)
      .eq('subcategory', question.subcategory)
      .single();

    if (performanceError && performanceError.code !== 'PGRST116') { // Not found error
      console.error('Error fetching performance:', performanceError);
      return NextResponse.json({ error: 'Failed to fetch performance' }, { status: 500 });
    }

    const newPerformance = {
      user_id: session.user.id,
      subject_id: question.subject_id,
      main_category: question.main_category,
      subcategory: question.subcategory,
      total_attempts: (performance?.total_attempts || 0) + 1,
      correct_answers: (performance?.correct_answers || 0) + (isCorrect ? 1 : 0),
      last_attempt_at: new Date().toISOString()
    };

    // Calculate accuracy percentage
    newPerformance.accuracy_percentage = Math.round(
      (newPerformance.correct_answers / newPerformance.total_attempts) * 100
    );

    // Determine mastery level
    if (newPerformance.total_attempts < 5) {
      newPerformance.mastery_level = 'Needs More Attempts';
    } else if (newPerformance.accuracy_percentage >= 90) {
      newPerformance.mastery_level = 'Mastered';
    } else if (newPerformance.accuracy_percentage >= 70) {
      newPerformance.mastery_level = 'On Track';
    } else {
      newPerformance.mastery_level = 'Needs Practice';
    }

    // Upsert the performance record
    const { error: upsertError } = await supabase
      .from('skill_performance')
      .upsert(newPerformance);

    if (upsertError) {
      console.error('Error updating performance:', upsertError);
      return NextResponse.json({ error: 'Failed to update performance' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      performance: newPerformance
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 