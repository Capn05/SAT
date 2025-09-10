import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Ensure authenticated user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { questionId, reportMessage } = await request.json();
    if (!questionId || Number.isNaN(Number(questionId))) {
      return NextResponse.json({ error: 'Invalid questionId' }, { status: 400 });
    }

    // Optional: validate question exists
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('id')
      .eq('id', questionId)
      .single();

    if (questionError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Record the flag; prevent duplicates per user/question
    const { error: upsertError } = await supabase
      .from('flagged_questions')
      .upsert({
        user_id: session.user.id,
        question_id: questionId,
        flagged_at: new Date().toISOString(),
        report_message: reportMessage || null
      }, {
        onConflict: ['user_id', 'question_id']
      });

    if (upsertError) {
      return NextResponse.json({ error: 'Failed to record flag' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}


