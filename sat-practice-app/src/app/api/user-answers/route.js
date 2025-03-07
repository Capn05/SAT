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
    
    // Handle missing session or session error
    if (!session || sessionError) {
      console.error('Auth session missing or error:', sessionError);
      return new NextResponse(
        JSON.stringify({ 
          error: 'Authentication required',
          code: 'AUTH_REQUIRED'
        }), 
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const { questionId, optionId, isCorrect, subject, category, mode } = await request.json();
    console.log('Processing answer:', { questionId, optionId, isCorrect, subject, category, mode });

    // Get question details to ensure we're updating the correct category
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('subject_id, main_category, subcategory')
      .eq('id', questionId)
      .single();

    if (questionError) {
      console.error('Error fetching question:', questionError);
      return NextResponse.json({ error: 'Failed to fetch question details' }, { status: 500 });
    }

    // Verify the question belongs to the specified category
    if (mode === 'skill' && question.subcategory !== category) {
      console.error('Category mismatch:', { expected: category, actual: question.subcategory });
      return NextResponse.json({ error: 'Question category mismatch' }, { status: 400 });
    }

    // Record the user's answer
    const { error: answerError } = await supabase
      .from('user_answers')
      .upsert({
        user_id: session.user.id,
        question_id: questionId,
        option_id: optionId,
        is_correct: isCorrect,
        answered_at: new Date().toISOString(),
        category: question.subcategory
      }, {
        onConflict: 'user_id,question_id'
      });

    if (answerError) {
      console.error('Error recording answer:', answerError);
      return NextResponse.json({ error: 'Failed to record answer', details: answerError }, { status: 500 });
    }

    // Get all questions for this subject to ensure we have complete category data
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, subject_id, main_category, subcategory')
      .eq('subject_id', question.subject_id);

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    // Get all user answers for this subject
    const { data: answers, error: answersError } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_id', session.user.id);

    if (answersError) {
      console.error('Error fetching answers:', answersError);
      return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 });
    }

    // Group questions by category
    const categoryQuestions = questions.reduce((acc, q) => {
      const key = `${q.main_category}-${q.subcategory}`;
      if (!acc[key]) {
        acc[key] = {
          subject_id: q.subject_id,
          main_category: q.main_category,
          subcategory: q.subcategory,
          questions: new Set()
        };
      }
      acc[key].questions.add(q.id);
      return acc;
    }, {});

    // Calculate performance for each category
    for (const key of Object.keys(categoryQuestions)) {
      const category = categoryQuestions[key];
      
      // Filter answers for this category's questions
      const categoryAnswers = answers.filter(a => 
        category.questions.has(a.question_id)
      );

      // Get unique question attempts
      const uniqueAttempts = new Map();
      categoryAnswers.forEach(answer => {
        if (!uniqueAttempts.has(answer.question_id)) {
          uniqueAttempts.set(answer.question_id, answer.is_correct);
        }
      });

      const totalAttempts = uniqueAttempts.size;
      const correctAnswers = Array.from(uniqueAttempts.values()).filter(isCorrect => isCorrect).length;
      const accuracyPercentage = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;

      let masteryLevel;
      if (totalAttempts < 5) {
        masteryLevel = 'Needs More Attempts';
      } else if (accuracyPercentage >= 90) {
        masteryLevel = 'Mastered';
      } else if (accuracyPercentage >= 70) {
        masteryLevel = 'On Track';
      } else {
        masteryLevel = 'Needs Practice';
      }

      // Update skill performance
      const { error: updateError } = await supabase
        .from('skill_performance')
        .upsert({
          user_id: session.user.id,
          subject_id: category.subject_id,
          main_category: category.main_category,
          subcategory: category.subcategory,
          total_attempts: totalAttempts,
          correct_answers: correctAnswers,
          accuracy_percentage: accuracyPercentage,
          mastery_level: masteryLevel,
          last_attempt_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,subject_id,subcategory'
        });

      if (updateError) {
        console.error('Error updating performance for category:', category, updateError);
      }
    }

    // Get the updated performance for the current category
    const { data: currentPerformance, error: perfError } = await supabase
      .from('skill_performance')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('subject_id', question.subject_id)
      .eq('subcategory', question.subcategory)
      .single();

    if (perfError) {
      console.error('Error fetching updated performance:', perfError);
    }

    return NextResponse.json({ 
      success: true,
      performance: currentPerformance || {
        totalAttempts: 1,
        correctAnswers: isCorrect ? 1 : 0,
        accuracyPercentage: isCorrect ? 100 : 0,
        masteryLevel: 'Needs More Attempts'
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
} 