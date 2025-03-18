import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!session) {
      console.log('No session found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get user's performance data from user_skill_analytics
    const { data: skillAnalytics, error: analyticsError } = await supabase
      .from('user_skill_analytics')
      .select('total_attempts, correct_attempts')
      .eq('user_id', userId);

    if (analyticsError) {
      console.error('Error fetching skill analytics:', analyticsError);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    // Get user's test answers from user_answers table
    const { data: testAnswers, error: testAnswersError } = await supabase
      .from('user_answers')
      .select('is_correct')
      .eq('user_id', userId)
      .eq('practice_type', 'test');

    if (testAnswersError) {
      console.error('Error fetching test answers:', testAnswersError);
      return NextResponse.json({ error: 'Failed to fetch test answers' }, { status: 500 });
    }

    // Calculate total from skill analytics
    const skillTotalAttempts = skillAnalytics.reduce((sum, record) => sum + record.total_attempts, 0);
    const skillCorrectAttempts = skillAnalytics.reduce((sum, record) => sum + record.correct_attempts, 0);
    
    // Calculate total from test answers
    const testTotalAttempts = testAnswers.length;
    const testCorrectAttempts = testAnswers.filter(answer => answer.is_correct).length;
    
    // Calculate combined statistics
    const totalAttempts = skillTotalAttempts + testTotalAttempts;
    const correctAttempts = skillCorrectAttempts + testCorrectAttempts;
    const accuracyPercentage = totalAttempts > 0
      ? (correctAttempts / totalAttempts) * 100
      : 0;

    console.log(`User stats: Total attempts = ${totalAttempts} (${skillTotalAttempts} from skills + ${testTotalAttempts} from tests)`);
    console.log(`User stats: Correct answers = ${correctAttempts} (${skillCorrectAttempts} from skills + ${testCorrectAttempts} from tests)`);

    return NextResponse.json({
      stats: {
        questionsAnswered: totalAttempts,
        correctAnswers: correctAttempts,
        accuracyPercentage
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 