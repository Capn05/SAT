import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { userId, subject } = await request.json();

    // Verify the user is requesting their own data
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all questions for this subject to ensure we have complete category data
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('subject_id, main_category, subcategory')
      .eq('subject_id', subject);

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    // Get all user answers for this subject
    const { data: answers, error: answersError } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_id', userId);

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
          count: 0
        };
      }
      acc[key].count++;
      return acc;
    }, {});

    // Calculate performance for each category
    for (const key of Object.keys(categoryQuestions)) {
      const category = categoryQuestions[key];
      
      // Filter answers for this category
      const categoryAnswers = answers.filter(a => {
        const question = questions.find(q => q.id === a.question_id);
        return question && 
               question.main_category === category.main_category && 
               question.subcategory === category.subcategory;
      });

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
          user_id: userId,
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

    return NextResponse.json({ 
      success: true,
      message: 'Skills cache refreshed successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
} 