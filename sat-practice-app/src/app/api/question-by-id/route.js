import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current session (for development/testing purposes)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('id');

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }

    console.log('Fetching question with ID:', questionId);

    // Fetch the question with all related data
    const { data: question, error: questionError } = await supabase
      .from('new_questions')
      .select(`
        *,
        new_options(*),
        subjects(subject_name),
        domains(domain_name),
        subcategories(subcategory_name),
        test_modules(module_number, is_harder, practice_test_id, practice_tests(name))
      `)
      .eq('id', questionId)
      .single();

    if (questionError) {
      console.error('Error fetching question:', questionError);
      return NextResponse.json({ 
        error: 'Failed to fetch question',
        details: questionError
      }, { status: 500 });
    }

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Check if options exist and sort them by value (A, B, C, D)
    const options = question.new_options || [];
    const sortedOptions = options.sort((a, b) => a.value.localeCompare(b.value));

    // Find the correct answer
    const correctAnswer = sortedOptions.find(option => option.is_correct);

    // Structure the response with all relevant information
    const questionData = {
      id: question.id,
      text: question.question_text,
      imageUrl: question.image_url,
      difficulty: question.difficulty,
      subjectId: question.subject_id,
      domainId: question.domain_id,
      subcategoryId: question.subcategory_id,
      testModuleId: question.test_module_id,
      
      // Related data
      subjectName: question.subjects?.subject_name,
      domainName: question.domains?.domain_name,
      subcategoryName: question.subcategories?.subcategory_name,
      moduleInfo: question.test_modules ? {
        moduleNumber: question.test_modules.module_number,
        isHarder: question.test_modules.is_harder,
        practiceTestId: question.test_modules.practice_test_id,
        practiceTestName: question.test_modules.practice_tests?.name
      } : null,
      
      // Options with correct answer highlighted
      options: sortedOptions.map(option => ({
        id: option.id,
        value: option.value,
        text: option.label,
        isCorrect: option.is_correct
      })),
      
      // Summary info
      correctAnswer: correctAnswer ? {
        value: correctAnswer.value,
        text: correctAnswer.label
      } : null
    };

    console.log(`Successfully fetched question ${questionId}`);
    return NextResponse.json(questionData);

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
