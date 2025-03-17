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
    const requestBody = await request.json();
    
    // Log the request data for debugging
    console.log('Pause test request:', {
      userId,
      testId: requestBody.testId,
      moduleId: requestBody.moduleId,
      currentQuestion: requestBody.currentQuestion,
      answersCount: requestBody.answers?.length
    });
    
    const { 
      testId, 
      moduleId, 
      currentQuestion, 
      timeRemaining, 
      answers = [], 
      flaggedQuestions = []
    } = requestBody;
    
    if (!testId || !moduleId) {
      return NextResponse.json({ error: 'Test ID and Module ID are required' }, { status: 400 });
    }
    
    // Check if the test exists
    const { data: testData, error: testError } = await supabase
      .from('practice_tests')
      .select('id')
      .eq('id', testId)
      .single();
      
    if (testError) {
      console.error('Error checking test:', testError);
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }
    
    // Check if the module exists
    const { data: moduleData, error: moduleError } = await supabase
      .from('test_modules')
      .select('id')
      .eq('id', moduleId)
      .eq('practice_test_id', testId)
      .single();
      
    if (moduleError) {
      console.error('Error checking module:', moduleError);
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
      console.error('Error checking existing paused test:', existingError);
      return NextResponse.json({ error: 'Error checking existing paused test' }, { status: 500 });
    }
    
    // Stringify the answers and flagged questions arrays for storage
    const answersString = JSON.stringify(answers);
    const flaggedQuestionsString = JSON.stringify(flaggedQuestions);
    
    let result;
    
    if (existingPausedTest) {
      // Update the existing paused test
      const { data, error } = await supabase
        .from('paused_tests')
        .update({
          current_question: currentQuestion,
          time_remaining: timeRemaining,
          answers: answersString,
          flagged_questions: flaggedQuestionsString,
          paused_at: new Date().toISOString()
        })
        .eq('id', existingPausedTest.id)
        .select();
        
      if (error) {
        console.error('Error updating paused test:', error);
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
          answers: answersString,
          flagged_questions: flaggedQuestionsString,
          paused_at: new Date().toISOString()
        })
        .select();
        
      if (error) {
        console.error('Error creating paused test:', error);
        return NextResponse.json({ error: 'Error creating paused test' }, { status: 500 });
      }
      
      result = data;
    }
    
    console.log('Paused test saved successfully:', result);
    
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
    const testId = parseInt(url.searchParams.get('testId'));
    const moduleId = parseInt(url.searchParams.get('moduleId'));
    
    if (!testId || !moduleId) {
      return NextResponse.json({ error: 'Test ID and Module ID are required' }, { status: 400 });
    }
    
    console.log(`Deleting paused test for user ${userId}, test ${testId}, module ${moduleId}`);
    
    // Delete the paused test
    const { error: deleteError } = await supabase
      .from('paused_tests')
      .delete()
      .eq('user_id', userId)
      .eq('practice_test_id', testId)
      .eq('test_module_id', moduleId);
      
    if (deleteError) {
      console.error('Error deleting paused test:', deleteError);
      return NextResponse.json({ error: 'Error deleting paused test' }, { status: 500 });
    }
    
    return NextResponse.json({ message: 'Paused test deleted successfully' });
    
  } catch (error) {
    console.error('Unexpected error in pause-test DELETE:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 