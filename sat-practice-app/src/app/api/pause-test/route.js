import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Save a paused test
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
    const { testId, moduleId, currentQuestion, timeRemaining, answers, flaggedQuestions } = await request.json();
    
    // Check if the test belongs to the user
    const { data: testData, error: testError } = await supabase
      .from('practice_tests')
      .select('id')
      .eq('id', testId)
      .single();
      
    if (testError || !testData) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }
    
    // Check if the module belongs to the test
    const { data: moduleData, error: moduleError } = await supabase
      .from('test_modules')
      .select('id')
      .eq('id', moduleId)
      .eq('practice_test_id', testId)
      .single();
      
    if (moduleError || !moduleData) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }
    
    // Check if there's already a paused test for this user, test, and module
    const { data: existingPausedTest, error: existingError } = await supabase
      .from('paused_tests')
      .select('id')
      .eq('user_id', userId)
      .eq('practice_test_id', testId)
      .eq('test_module_id', moduleId)
      .maybeSingle();
      
    if (existingError) {
      return NextResponse.json({ error: 'Error checking existing paused test' }, { status: 500 });
    }
    
    let result;
    
    if (existingPausedTest) {
      // Update the existing paused test
      const { data, error } = await supabase
        .from('paused_tests')
        .update({
          current_question: currentQuestion,
          time_remaining: timeRemaining,
          answers: JSON.stringify(answers),
          flagged_questions: JSON.stringify(flaggedQuestions),
          paused_at: new Date().toISOString()
        })
        .eq('id', existingPausedTest.id)
        .select();
        
      if (error) {
        return NextResponse.json({ error: 'Error updating paused test' }, { status: 500 });
      }
      
      result = data;
    } else {
      // Create a new paused test
      const { data, error } = await supabase
        .from('paused_tests')
        .insert({
          user_id: userId,
          practice_test_id: testId,
          test_module_id: moduleId,
          current_question: currentQuestion,
          time_remaining: timeRemaining,
          answers: JSON.stringify(answers),
          flagged_questions: JSON.stringify(flaggedQuestions),
          paused_at: new Date().toISOString()
        })
        .select();
        
      if (error) {
        return NextResponse.json({ error: 'Error creating paused test' }, { status: 500 });
      }
      
      result = data;
    }
    
    return NextResponse.json({ 
      message: 'Test paused successfully',
      pausedTest: result[0]
    });
    
  } catch (error) {
    console.error('Unexpected error in pause-test:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

// Delete a paused test
export async function DELETE(request) {
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
    
    // Delete the paused test
    const { error: deleteError } = await supabase
      .from('paused_tests')
      .delete()
      .eq('user_id', userId)
      .eq('practice_test_id', testId)
      .eq('test_module_id', moduleId);
      
    if (deleteError) {
      return NextResponse.json({ error: 'Error deleting paused test' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Paused test deleted successfully' });
    
  } catch (error) {
    console.error('Unexpected error in pause-test DELETE:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 