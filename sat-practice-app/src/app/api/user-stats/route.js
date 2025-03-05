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

    // Get answers from both tables
    const [officialResponse, practiceResponse] = await Promise.all([
      supabase
        .from('official_user_answers')
        .select('is_correct')
        .eq('user_id', userId),
      supabase
        .from('user_answers')
        .select('is_correct')
        .eq('user_id', userId)
    ]);

    if (officialResponse.error || practiceResponse.error) {
      console.error('Error fetching answers:', { 
        official: officialResponse.error, 
        practice: practiceResponse.error 
      });
      return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 });
    }

    const allAnswers = [
      ...(officialResponse.data || []),
      ...(practiceResponse.data || [])
    ];

    const questionsAnswered = allAnswers.length;
    const correctAnswers = allAnswers.filter(answer => answer.is_correct).length;
    const accuracyPercentage = questionsAnswered > 0
      ? Math.round((correctAnswers / questionsAnswered) * 100)
      : 0;

    return NextResponse.json({
      stats: {
        questionsAnswered,
        correctAnswers,
        accuracyPercentage
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 