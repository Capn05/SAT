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
    const testId = parseInt(url.searchParams.get('testId'));
    const moduleId = parseInt(url.searchParams.get('moduleId'));
    
    if (!testId || !moduleId) {
      return NextResponse.json({ error: 'Test ID and Module ID are required' }, { status: 400 });
    }
    
    console.log(`Fetching paused test for user ${userId}, test ${testId}, module ${moduleId}`);
    
    // Get the paused test
    const { data: pausedTest, error: pausedError } = await supabase
      .from('paused_tests')
      .select('*')
      .eq('user_id', userId)
      .eq('practice_test_id', testId)
      .eq('test_module_id', moduleId)
      .maybeSingle();
      
    if (pausedError) {
      console.error('Error retrieving paused test:', pausedError);
      return NextResponse.json({ error: 'Error retrieving paused test' }, { status: 500 });
    }
    
    if (!pausedTest) {
      console.log('No paused test found');
      return NextResponse.json({ message: 'No paused test found' }, { status: 404 });
    }
    
    console.log('Found paused test:', pausedTest);
    
    // Parse the JSON strings for answers and flagged questions
    let answers = [];
    let flaggedQuestions = [];
    
    try {
      if (pausedTest.answers) {
        if (typeof pausedTest.answers === 'string') {
          answers = JSON.parse(pausedTest.answers);
        } else {
          answers = pausedTest.answers;
        }
      }
      
      if (pausedTest.flagged_questions) {
        if (typeof pausedTest.flagged_questions === 'string') {
          flaggedQuestions = JSON.parse(pausedTest.flagged_questions);
        } else {
          flaggedQuestions = pausedTest.flagged_questions;
        }
      }
    } catch (parseError) {
      console.error('Error parsing JSON data:', parseError);
      // Continue with empty arrays rather than failing
    }
    
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
    
    // Get list of completed tests for this user
    const { data: completedTests, error: completedError } = await supabase
      .from('user_test_analytics')
      .select('practice_test_id')
      .eq('user_id', userId);
      
    if (completedError) {
      console.error('Error fetching completed tests:', completedError);
      // Continue with all paused tests if we can't filter
      return NextResponse.json({ pausedTests });
    }
    
    // Create a set of completed test IDs for fast lookup
    const completedTestIds = new Set(completedTests.map(test => test.practice_test_id));
    
    // Filter out any paused tests that have been completed
    const filteredPausedTests = pausedTests.filter(test => 
      !completedTestIds.has(test.practice_test_id)
    );
    
    return NextResponse.json({ pausedTests: filteredPausedTests });
    
  } catch (error) {
    console.error('Unexpected error in paused-test POST:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 