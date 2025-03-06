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

    console.log('Fetching questions with params:', { subject, category, difficulty });

    if (!subject || !category) {
      return NextResponse.json({ error: 'Subject and category are required' }, { status: 400 });
    }

    // First, get the IDs of questions the user has already answered
    const { data: answeredQuestions, error: answeredError } = await supabase
      .from('user_answers')
      .select('question_id')
      .eq('user_id', session.user.id);

    if (answeredError) {
      console.error('Error fetching answered questions:', answeredError);
      return NextResponse.json({ 
        error: 'Failed to fetch user answer history',
        details: answeredError
      }, { status: 500 });
    }

    // Create an array of answered question IDs
    const answeredQuestionIds = answeredQuestions.map(item => item.question_id);
    console.log(`User has answered ${answeredQuestionIds.length} questions previously`);

    // Get questions that match the category and haven't been answered yet
    let query = supabase
      .from('questions')
      .select('*, options(*)')
      .eq('subject_id', subject)
      .eq('subcategory', category);

    // Add difficulty filter if not mixed
    if (difficulty && difficulty !== 'mixed') {
      const capitalizedDifficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
      query = query.eq('difficulty', capitalizedDifficulty);
      console.log(`Filtering by difficulty: ${capitalizedDifficulty}`);
    }

    // Add filter to exclude answered questions if there are any
    if (answeredQuestionIds.length > 0) {
      query = query.not('id', 'in', `(${answeredQuestionIds.join(',')})`);
    }

    // Limit to 5 questions
    const { data: questions, error: questionsError } = await query.limit(5);

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json({ 
        error: 'Failed to fetch questions',
        details: questionsError
      }, { status: 500 });
    }

    // If we don't have enough unanswered questions, fetch some answered ones to fill the gap
    if (questions.length < 5) {
      console.log(`Only found ${questions.length} unanswered questions, fetching some answered ones to fill the gap`);
      
      // Calculate how many more questions we need
      const additionalNeeded = 5 - questions.length;
      
      // Fetch answered questions if we need more
      if (additionalNeeded > 0 && answeredQuestionIds.length > 0) {
        let backupQuery = supabase
          .from('questions')
          .select('*, options(*)')
          .eq('subject_id', subject)
          .eq('subcategory', category)
          .in('id', answeredQuestionIds);
          
        // Add difficulty filter for backup questions too
        if (difficulty && difficulty !== 'mixed') {
          const capitalizedDifficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
          backupQuery = backupQuery.eq('difficulty', capitalizedDifficulty);
        }
          
        const { data: answeredQs, error: answeredQsError } = await backupQuery.limit(additionalNeeded);
          
        if (!answeredQsError && answeredQs) {
          // Combine unanswered and answered questions
          questions.push(...answeredQs);
          console.log(`Added ${answeredQs.length} previously answered questions`);
        }
      }
      
      // If we still don't have enough questions and we're filtering by difficulty,
      // try getting questions of any difficulty
      if (questions.length < 5 && difficulty && difficulty !== 'mixed') {
        console.log(`Still need more questions, fetching questions of any difficulty`);
        
        let anyDifficultyQuery = supabase
          .from('questions')
          .select('*, options(*)')
          .eq('subject_id', subject)
          .eq('subcategory', category);
          
        // Exclude both answered questions and questions we already have
        const existingIds = questions.map(q => q.id);
        const excludeIds = [...answeredQuestionIds, ...existingIds];
        
        if (excludeIds.length > 0) {
          anyDifficultyQuery = anyDifficultyQuery.not('id', 'in', `(${excludeIds.join(',')})`);
        }
        
        const { data: anyDifficultyQs, error: anyDifficultyError } = await anyDifficultyQuery
          .limit(5 - questions.length);
          
        if (!anyDifficultyError && anyDifficultyQs && anyDifficultyQs.length > 0) {
          questions.push(...anyDifficultyQs);
          console.log(`Added ${anyDifficultyQs.length} questions of any difficulty`);
        }
      }
    }

    if (!questions || questions.length === 0) {
      console.log('No questions found');
      return NextResponse.json({ 
        questions: [],
        message: 'No questions available for this category' 
      });
    }

    console.log(`Returning ${questions.length} questions for category ${category} with difficulty ${difficulty}`);

    // Shuffle the options for each question
    const shuffledQuestions = questions.map(q => ({
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