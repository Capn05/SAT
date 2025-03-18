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
    const difficulty = searchParams.get('difficulty') || 'mixed';
    const includePreviouslyAnswered = searchParams.get('previouslyAnswered') === 'true';

    console.log('Fetching questions with params:', { 
      subject, 
      category, 
      difficulty, 
      includePreviouslyAnswered
    });

    if (!subject || !category) {
      return NextResponse.json({ error: 'Subject and category are required' }, { status: 400 });
    }

    // Get user's previously answered questions
    const { data: userAnswers, error: userAnswersError } = await supabase
      .from('user_answers')
      .select('question_id')
      .eq('user_id', session.user.id);

    if (userAnswersError) {
      console.error('Error fetching user answers:', userAnswersError);
      return NextResponse.json({ error: 'Failed to fetch user answer history' }, { status: 500 });
    }

    // Create a set of answered question IDs for quick lookup
    const answeredQuestionIds = new Set(userAnswers?.map(a => a.question_id) || []);
    console.log(`User has answered ${answeredQuestionIds.size} questions previously in the database`);

    // First, get the subcategory ID for the given category name
    const { data: subcategory, error: subcategoryError } = await supabase
      .from('subcategories')
      .select('id, domain_id')
      .eq('subcategory_name', category)
      .single();

    if (subcategoryError || !subcategory) {
      console.error('Error fetching subcategory:', subcategoryError);
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    // Get questions that match the subcategory
    let query = supabase
      .from('questions')
      .select(`
        *,
        options(*),
        domains!inner (
          id,
          domain_name
        ),
        subcategories!inner (
          id,
          subcategory_name
        )
      `)
      .eq('subject_id', subject)
      .eq('subcategory_id', subcategory.id);

    // Add difficulty filter if not mixed
    if (difficulty && difficulty !== 'mixed') {
      const capitalizedDifficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
      query = query.eq('difficulty', capitalizedDifficulty);
      console.log(`Filtering by difficulty: ${capitalizedDifficulty}`);
    }

    // Get all matching questions
    const { data: questions, error: questionsError } = await query;

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

    // Separate unanswered and answered questions
    const unansweredQuestions = questions.filter(q => !answeredQuestionIds.has(q.id));
    const answeredQuestions = questions.filter(q => answeredQuestionIds.has(q.id));
    
    console.log(`Found ${unansweredQuestions.length} unanswered questions and ${answeredQuestions.length} previously answered questions for category ${category}`);
    
    // Prioritize unanswered questions
    let selectedQuestions = [];
    const questionCount = 5; // For skill practice, we want 5 questions
    
    // If we have enough unanswered questions, use only those
    if (unansweredQuestions.length >= questionCount) {
      // Randomize the selection of unanswered questions
      selectedQuestions = unansweredQuestions.sort(() => Math.random() - 0.5).slice(0, questionCount);
      console.log(`Using ${selectedQuestions.length} unanswered questions`);
    } 
    // Otherwise, if we allow previously answered questions, fill in with those
    else if (includePreviouslyAnswered && answeredQuestions.length > 0) {
      // Use all unanswered questions plus some answered ones to reach the target count
      const shuffledAnsweredQuestions = answeredQuestions.sort(() => Math.random() - 0.5);
      selectedQuestions = [
        ...unansweredQuestions,
        ...shuffledAnsweredQuestions.slice(0, questionCount - unansweredQuestions.length)
      ];
      console.log(`Using ${unansweredQuestions.length} unanswered questions and ${selectedQuestions.length - unansweredQuestions.length} previously answered questions`);
    }
    // If we don't allow previously answered, just use what we have
    else {
      selectedQuestions = unansweredQuestions;
      console.log(`Only using ${selectedQuestions.length} unanswered questions (not enough for a full set)`);
    }

    console.log(`Returning ${selectedQuestions.length} questions for category ${category} with difficulty ${difficulty}`);

    // Shuffle the options for each question
    const shuffledQuestions = selectedQuestions.map(q => ({
      ...q,
      options: q.options.sort(() => Math.random() - 0.5)
    }));
    
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
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const body = await request.json();
    const { questionId, selectedAnswerId, isCorrect } = body;

    // Get question details for updating skill analytics
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
        selected_option_id: selectedAnswerId,
        is_correct: isCorrect,
        practice_type: 'skill',
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
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 