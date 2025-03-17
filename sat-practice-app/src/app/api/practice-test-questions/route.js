import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const moduleId = searchParams.get('moduleId');
  
  if (!moduleId) {
    return NextResponse.json({ error: 'Module ID is required' }, { status: 400 });
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
    
    // First get the module to know which practice test and module number we're dealing with
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
    
    // Fetch questions for the requested module
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
        domains(domain_name),
        subcategories(subcategory_name)
      `)
      .eq('test_module_id', moduleId)
      .order('id');
    
    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }
    
    // Fetch options for all questions
    const questionsWithOptions = await Promise.all(questions.map(async (question) => {
      const { data: options, error: optionsError } = await supabase
        .from('options')
        .select('*')
        .eq('question_id', question.id)
        .order('id');
      
      if (optionsError) {
        console.error(`Error fetching options for question ${question.id}:`, optionsError);
        return { ...question, options: [] };
      }
      
      // Format options for the frontend
      const formattedOptions = options.map(option => ({
        id: option.id,
        value: option.value,
        label: option.label,
        isCorrect: option.is_correct
      }));
      
      return { ...question, options: formattedOptions };
    }));
    
    // Return module info and questions with options
    return NextResponse.json({
      moduleInfo: {
        id: moduleData.id,
        moduleNumber: moduleData.module_number,
        isHarder: moduleData.is_harder,
        practiceTestId: moduleData.practice_test_id,
        subjectId: moduleData.practice_tests.subject_id
      },
      questions: questionsWithOptions
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 