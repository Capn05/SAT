import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');

    console.log('Fetching quick practice questions for subject:', subject);

    if (!subject) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }

    // Get user's answer history for this subject
    const { data: userAnswers, error: answersError } = await supabase
      .from('user_answers')
      .select('question_id, is_correct')
      .eq('user_id', session.user.id);

    if (answersError) {
      console.error('Error fetching user answers:', answersError);
      return NextResponse.json({ error: 'Failed to fetch user history' }, { status: 500 });
    }

    // Create a map of question IDs to their success rate
    const questionAttempts = new Map();
    userAnswers?.forEach(answer => {
      if (!questionAttempts.has(answer.question_id)) {
        questionAttempts.set(answer.question_id, {
          attempts: 0,
          correct: 0
        });
      }
      const stats = questionAttempts.get(answer.question_id);
      stats.attempts++;
      if (answer.is_correct) stats.correct++;
    });

    // Get all questions for this subject
    const { data: allQuestions, error: questionsError } = await supabase
      .from('questions')
      .select('*, options(*)')
      .eq('subject_id', subject);

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    if (!allQuestions || allQuestions.length === 0) {
      return NextResponse.json({ 
        questions: [],
        message: 'No questions available for this subject' 
      });
    }

    // Sort questions by priority:
    // 1. Never attempted
    // 2. Low success rate
    // 3. Not attempted recently
    const sortedQuestions = allQuestions.sort((a, b) => {
      const statsA = questionAttempts.get(a.id);
      const statsB = questionAttempts.get(b.id);

      // If neither has been attempted, maintain original order
      if (!statsA && !statsB) return 0;
      
      // Prioritize never attempted questions
      if (!statsA) return -1;
      if (!statsB) return 1;

      // Then sort by success rate
      const rateA = statsA.correct / statsA.attempts;
      const rateB = statsB.correct / statsB.attempts;
      return rateA - rateB;
    });

    // Take the first 15 questions (or less if not enough available)
    const selectedQuestions = sortedQuestions.slice(0, 15).map(q => ({
      ...q,
      options: q.options.sort(() => Math.random() - 0.5) // Shuffle options
    }));

    console.log(`Returning ${selectedQuestions.length} questions for quick practice`);
    
    return NextResponse.json({ questions: selectedQuestions });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
} 