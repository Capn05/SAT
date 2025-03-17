import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Get a paused test
export async function GET(request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }
    
    if (!session?.user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const url = new URL(request.url);
    const testId = url.searchParams.get('testId');
    const moduleId = url.searchParams.get('moduleId');
    
    if (!testId || !moduleId) {
      return NextResponse.json({ error: 'Test ID and Module ID are required' }, { status: 400 });
    }
    
    // Get the paused test
    const { data: pausedTest, error: pausedError } = await supabase
      .from('paused_tests')
      .select('*')
      .eq('user_id', userId)
      .eq('practice_test_id', testId)
      .eq('test_module_id', moduleId)
      .maybeSingle();
      
    if (pausedError) {
      return NextResponse.json({ error: 'Error retrieving paused test' }, { status: 500 });
    }
    
    if (!pausedTest) {
      return NextResponse.json({ message: 'No paused test found' }, { status: 404 });
    }
    
    // Parse the JSON strings for answers and flagged questions
    const answers = JSON.parse(pausedTest.answers || '[]');
    const flaggedQuestions = JSON.parse(pausedTest.flagged_questions || '[]');
    
    return NextResponse.json({ 
      pausedTest: {
        ...pausedTest,
        answers,
        flaggedQuestions
      }
    });
    
  } catch (error) {
    console.error('Unexpected error in paused-test GET:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// Get all paused tests for the user
export async function POST(request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }
    
    if (!session?.user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get all paused tests for the user
    const { data: pausedTests, error: pausedError } = await supabase
      .from('paused_tests')
      .select(`
        id,
        practice_test_id,
        test_module_id,
        current_question,
        time_remaining,
        paused_at,
        practice_tests(
          id,
          name,
          subject_id,
          subjects(subject_name)
        ),
        test_modules(
          id,
          module_number,
          is_harder
        )
      `)
      .eq('user_id', userId)
      .order('paused_at', { ascending: false });
      
    if (pausedError) {
      return NextResponse.json({ error: 'Error retrieving paused tests' }, { status: 500 });
    }
    
    return NextResponse.json({ pausedTests });
    
  } catch (error) {
    console.error('Unexpected error in paused-test POST:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 