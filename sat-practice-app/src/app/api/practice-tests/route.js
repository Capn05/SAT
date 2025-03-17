import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const subject_id = searchParams.get('subject_id');
  
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
    
    const user_id = session.user.id;
    
    // Fetch all practice tests with module information for the selected subject
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
    
    // Fetch module information for each practice test
    const testsWithModules = await Promise.all(practiceTests.map(async (test) => {
      // Get Module 1 info with question count
      const { data: modules1, error: module1Error } = await supabase
        .from('test_modules')
        .select('id')
        .eq('practice_test_id', test.id)
        .eq('module_number', 1);
      
      if (module1Error) {
        console.error(`Error fetching module 1 for test ${test.id}:`, module1Error);
        return { ...test, module1: null, hasModules: false };
      }
      
      // If module exists, get question count
      let module1 = null;
      if (modules1 && modules1.length > 0) {
        const { data: questionCount, error: countError } = await supabase
          .from('questions')
          .select('id', { count: 'exact' })
          .eq('test_module_id', modules1[0].id);
          
        if (!countError) {
          module1 = {
            id: modules1[0].id,
            question_count: questionCount.length
          };
        }
      }
      
      // Get Module 2 (easier) info
      const { data: modules2Easier, error: module2EasierError } = await supabase
        .from('test_modules')
        .select('id')
        .eq('practice_test_id', test.id)
        .eq('module_number', 2)
        .eq('is_harder', false);
      
      if (module2EasierError) {
        console.error(`Error fetching easier module 2 for test ${test.id}:`, module2EasierError);
        return { ...test, module1, module2Easier: null, hasModules: false };
      }
      
      // If module exists, get question count
      let module2Easier = null;
      if (modules2Easier && modules2Easier.length > 0) {
        const { data: questionCount, error: countError } = await supabase
          .from('questions')
          .select('id', { count: 'exact' })
          .eq('test_module_id', modules2Easier[0].id);
          
        if (!countError) {
          module2Easier = {
            id: modules2Easier[0].id,
            question_count: questionCount.length
          };
        }
      }
      
      // Get Module 2 (harder) info
      const { data: modules2Harder, error: module2HarderError } = await supabase
        .from('test_modules')
        .select('id')
        .eq('practice_test_id', test.id)
        .eq('module_number', 2)
        .eq('is_harder', true);
      
      if (module2HarderError) {
        console.error(`Error fetching harder module 2 for test ${test.id}:`, module2HarderError);
        return { 
          ...test, 
          module1, 
          module2Easier, 
          module2Harder: null,
          hasModules: false 
        };
      }
      
      // If module exists, get question count
      let module2Harder = null;
      if (modules2Harder && modules2Harder.length > 0) {
        const { data: questionCount, error: countError } = await supabase
          .from('questions')
          .select('id', { count: 'exact' })
          .eq('test_module_id', modules2Harder[0].id);
          
        if (!countError) {
          module2Harder = {
            id: modules2Harder[0].id,
            question_count: questionCount.length
          };
        }
      }
      
      // Check if all modules have questions (at least module 1 and one version of module 2)
      const hasRequiredQuestions = 
        module1?.question_count > 0 && 
        (module2Easier?.question_count > 0 || module2Harder?.question_count > 0);
      
      // Determine required question count based on subject
      const requiredQuestionCount = test.subject_id === 1 ? 22 : 27; // Math = 22, Reading & Writing = 27
      
      // Check if modules have the required number of questions
      const hasCompleteModules = 
        module1?.question_count === requiredQuestionCount &&
        (module2Easier?.question_count === requiredQuestionCount || module2Harder?.question_count === requiredQuestionCount);
      
      return {
        ...test,
        module1,
        module2Easier,
        module2Harder,
        hasModules: !!hasRequiredQuestions,
        isComplete: !!hasCompleteModules,
      };
    }));
    
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
    
    const processedTests = testsWithModules.map(test => ({
      ...test,
      completed: completedTestIds.has(test.id)
    }));
    
    return NextResponse.json(processedTests);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 