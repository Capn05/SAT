import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
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
    const requestData = await request.json();
    const { moduleId, answers } = requestData;
    
    if (!moduleId || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Module ID and answers array are required' }, { status: 400 });
    }
    
    // Get module information
    const { data: moduleData, error: moduleError } = await supabase
      .from('test_modules')
      .select(`
        id,
        module_number,
        is_harder,
        practice_test_id,
        practice_tests(subject_id)
      `)
      .eq('id', moduleId)
      .single();
    
    if (moduleError) {
      console.error('Error fetching module data:', moduleError);
      return NextResponse.json({ error: 'Failed to fetch module data' }, { status: 500 });
    }
    
    // Determine subject and use proper question counts
    const isSubjectMath = moduleData.practice_tests.subject_id === 1;
    
    // Hard-code question counts based on subject and module
    const singleModuleQuestions = isSubjectMath ? 22 : 27; // Math has 22, Reading has 27 per module
    
    // Set total questions for this module
    const totalQuestions = singleModuleQuestions;
    const attemptedQuestions = answers.length;
    let correctAnswers = 0;
    
    // Record each answer in user_answers table
    for (const answer of answers) {
      const { questionId, selectedOptionId, isCorrect } = answer;
      
      if (isCorrect) {
        correctAnswers++;
      }
      
      // Record the answer
      const { error: answerError } = await supabase
        .from('user_answers')
        .insert({
          user_id,
          question_id: questionId,
          selected_option_id: selectedOptionId,
          is_correct: isCorrect,
          practice_type: 'test',
          test_id: moduleData.practice_test_id,
          answered_at: new Date().toISOString()
        });
      
      if (answerError) {
        console.error('Error recording answer:', answerError);
        // Continue with other answers even if one fails
      }
    }
    
    // Create a score object that includes both attempted and total information
    const score = {
      correct: correctAnswers,
      attempted: attemptedQuestions,
      total: totalQuestions,
      percentage: (correctAnswers / totalQuestions) * 100
    };
    
    // If this was Module 1, determine which Module 2 to use next
    if (moduleData.module_number === 1) {
      // Different thresholds based on subject
      const correctThreshold = isSubjectMath ? 15 : 18; // Math: 15/22, Reading & Writing: 18/27
      
      // Decide whether to use the harder Module 2
      const useHarderModule = correctAnswers >= correctThreshold;
      
      // Get the appropriate Module 2
      const { data: module2Data, error: module2Error } = await supabase
        .from('test_modules')
        .select('id')
        .eq('practice_test_id', moduleData.practice_test_id)
        .eq('module_number', 2)
        .eq('is_harder', useHarderModule)
        .single();
      
      if (module2Error) {
        console.error('Error fetching Module 2:', module2Error);
        return NextResponse.json({ error: 'Failed to fetch next module' }, { status: 500 });
      }
      
      // Delete the paused test for this module if it exists
      const { error: deletePausedError } = await supabase
        .from('paused_tests')
        .delete()
        .eq('user_id', user_id)
        .eq('practice_test_id', moduleData.practice_test_id)
        .eq('test_module_id', moduleId);
      
      if (deletePausedError) {
        console.error('Error deleting paused test:', deletePausedError);
        // Continue anyway even if there's an error with deleting
      }
      
      // Return the score and next module ID
      return NextResponse.json({
        moduleComplete: true,
        score: {
          correct: correctAnswers,
          attempted: attemptedQuestions,
          total: totalQuestions,
          percentage: score.percentage
        },
        nextModule: {
          id: module2Data.id,
          isHarder: useHarderModule
        }
      });
    } 
    // If this was Module 2, update test analytics
    else if (moduleData.module_number === 2) {
      // Get the Module 1 score from user_answers
      const { data: module1Answers, error: module1Error } = await supabase
        .from('user_answers')
        .select('is_correct')
        .eq('user_id', user_id)
        .eq('test_id', moduleData.practice_test_id)
        .eq('practice_type', 'test');
      
      if (module1Error) {
        console.error('Error fetching previous answers:', module1Error);
        return NextResponse.json({ error: 'Failed to fetch previous module data' }, { status: 500 });
      }
      
      // Get the total questions for the entire test (both modules)
      const totalTestQuestions = singleModuleQuestions * 2; // Double for both modules
      
      // Calculate Module 1 score
      const module1Correct = module1Answers.filter(a => a.is_correct).length;
      
      // Calculate the combined score (Module 1 + Module 2)
      const totalCorrect = module1Correct + correctAnswers;
      
      // Calculate overall percentage based on total questions in both modules
      const overallPercentage = (totalCorrect / totalTestQuestions) * 100;
        
      // Delete all paused tests for this test (both modules)
      const { error: deletePausedError } = await supabase
        .from('paused_tests')
        .delete()
        .eq('user_id', user_id)
        .eq('practice_test_id', moduleData.practice_test_id);
      
      if (deletePausedError) {
        console.error('Error deleting paused tests:', deletePausedError);
        // Continue anyway even if there's an error with deleting
      }
        
      // Record test analytics
      const { error: analyticsError } = await supabase
        .from('user_test_analytics')
        .insert({
          user_id,
          practice_test_id: moduleData.practice_test_id,
          taken_at: new Date().toISOString(),
          module1_score: (module1Correct / singleModuleQuestions) * 100,
          module2_score: (correctAnswers / singleModuleQuestions) * 100,
          used_harder_module: moduleData.is_harder,
          total_score: overallPercentage
        });
      
      if (analyticsError) {
        console.error('Error recording test analytics:', analyticsError);
        return NextResponse.json({ error: 'Failed to record test analytics' }, { status: 500 });
      }
      
      // Return the score and indicate test is complete
      return NextResponse.json({
        moduleComplete: true,
        testComplete: true,
        score: {
          correct: correctAnswers,
          attempted: attemptedQuestions,
          total: totalQuestions,
          percentage: score.percentage
        },
        overallScore: {
          correct: totalCorrect,
          total: totalTestQuestions,
          percentage: overallPercentage
        }
      });
    }
    
    // Shouldn't reach here
    return NextResponse.json({ error: 'Invalid module number' }, { status: 400 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 