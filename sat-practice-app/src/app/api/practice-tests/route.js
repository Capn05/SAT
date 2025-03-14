import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const subject_id = searchParams.get('subject_id');
  
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }
    
    if (!session?.user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    const user_id = session.user.id;
    
    // Fetch all practice tests for the selected subject
    let query = supabase
      .from('practice_tests')
      .select(`
        id, 
        name, 
        subject_id, 
        subjects(subject_name)
      `);
    
    // Filter by subject if provided
    if (subject_id) {
      query = query.eq('subject_id', subject_id);
    }
    
    const { data: practiceTests, error: testsError } = await query;
    
    if (testsError) {
      console.error('Error fetching practice tests:', testsError);
      return NextResponse.json({ error: 'Failed to fetch practice tests' }, { status: 500 });
    }
    
    // Fetch completed tests for the user
    const { data: completedTests, error: completedError } = await supabase
      .from('user_test_analytics')
      .select('practice_test_id')
      .eq('user_id', user_id);
    
    if (completedError) {
      console.error('Error fetching completed tests:', completedError);
      return NextResponse.json({ error: 'Failed to fetch user test history' }, { status: 500 });
    }
    
    // Mark tests as completed or available
    const completedTestIds = new Set(completedTests?.map(test => test.practice_test_id) || []);
    
    const processedTests = practiceTests.map(test => ({
      ...test,
      completed: completedTestIds.has(test.id)
    }));
    
    return NextResponse.json(processedTests);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 