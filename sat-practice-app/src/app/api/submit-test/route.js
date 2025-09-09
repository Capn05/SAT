import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { user_id, test_id, name, answers } = await request.json();

    // Validate required fields
    if (!user_id || !test_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get all user answers for this test with question details
    const { data: userAnswers, error: answersError } = await supabase
      .from('official_user_answers')
      .select(`
        is_correct,
        question_id,
        option_id
      `)
      .eq('user_id', user_id)
      .eq('test_id', test_id);

    if (answersError) {
      return NextResponse.json(
        { error: answersError.message },
        { status: 500 }
      );
    }

    // Calculate score and gather statistics
    const totalAnswered = userAnswers.length;
    const correctAnswers = userAnswers.filter(answer => answer.is_correct).length;
    const score = correctAnswers;

    // Update user_tests table
    const { data, error } = await supabase
      .from('user_tests')
      .upsert({
        user_id,
        test_id,
        name,
        status: 'completed',
        score,
        updated_at: new Date().toISOString()
      }, {
        onConflict: ['user_id', 'test_id']
      });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Return detailed results
    return NextResponse.json({ 
      success: true,
      testSummary: {
        score,
        totalAnswered,
        correctAnswers,
        incorrectAnswers: totalAnswered - correctAnswers,
        testName: name,
        answers: userAnswers
      },
      message: 'Test submitted successfully'
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}