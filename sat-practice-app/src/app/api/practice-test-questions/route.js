import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const practiceTestId = searchParams.get('practice_test_id');
  const moduleNumber = searchParams.get('module_number');
  const isHarder = searchParams.get('is_harder'); // Used for module 2 selection
  
  if (!practiceTestId) {
    return NextResponse.json({ error: 'Practice test ID is required' }, { status: 400 });
  }
  
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
    
    // 1. Find the test module(s)
    let moduleQuery = supabase
      .from('test_modules')
      .select('*')
      .eq('practice_test_id', practiceTestId);
    
    // If specific module is requested
    if (moduleNumber) {
      moduleQuery = moduleQuery.eq('module_number', moduleNumber);
      
      // For module 2, we may need to filter by difficulty
      if (moduleNumber === '2' && isHarder !== null) {
        moduleQuery = moduleQuery.eq('is_harder', isHarder === 'true');
      }
    }
    
    const { data: modules, error: modulesError } = await moduleQuery;
    
    if (modulesError) {
      console.error('Error fetching test modules:', modulesError);
      return NextResponse.json({ error: 'Failed to fetch test modules' }, { status: 500 });
    }
    
    if (!modules || modules.length === 0) {
      return NextResponse.json({ error: 'No test modules found' }, { status: 404 });
    }
    
    // 2. Get questions for each module
    const result = await Promise.all(modules.map(async (module) => {
      // Fetch questions for this module
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select(`
          id,
          question_text,
          image_url,
          difficulty,
          subject_id,
          domain_id,
          subcategory_id,
          domains (domain_name),
          subcategories (subcategory_name)
        `)
        .eq('test_module_id', module.id);
      
      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        throw new Error('Failed to fetch questions');
      }
      
      // Fetch options for each question
      const questionsWithOptions = await Promise.all(questions.map(async (question) => {
        const { data: options, error: optionsError } = await supabase
          .from('options')
          .select('*')
          .eq('question_id', question.id);
        
        if (optionsError) {
          console.error('Error fetching options:', optionsError);
          throw new Error('Failed to fetch options');
        }
        
        return {
          ...question,
          options: options
        };
      }));
      
      return {
        module: module,
        questions: questionsWithOptions
      };
    }));
    
    // For a single module request, return just that module's data
    if (moduleNumber) {
      if (result.length === 0) {
        return NextResponse.json({ error: 'Module not found' }, { status: 404 });
      }
      return NextResponse.json(result[0]);
    }
    
    // Otherwise return all modules with their questions
    return NextResponse.json(result);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 