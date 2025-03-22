import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  
  const { searchParams } = new URL(request.url);
  const testId = searchParams.get('testId');

  if (!testId) {
    return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
  }

  try {
    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Authentication error:', sessionError);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }
    
    if (!session?.user) {
      console.error('No authenticated user found');
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log(`Fetching test questions for testId ${testId} and userId ${userId}`);
    
    // First, get the modules that the user has actually completed
    // We'll find this from the user_answers table
    const { data: userTestAnswers, error: userTestError } = await supabase
      .from('user_answers')
      .select('question_id, questions(test_module_id)')
      .eq('user_id', userId)
      .eq('test_id', testId)
      .eq('practice_type', 'test');
      
    if (userTestError) {
      console.error('Error fetching user test data:', userTestError);
      return NextResponse.json({ error: 'Failed to fetch user test data' }, { status: 500 });
    }
    
    if (!userTestAnswers || userTestAnswers.length === 0) {
      console.error(`No answers found for test ID ${testId} for user ${userId}`);
      return NextResponse.json({ 
        error: 'No completed questions found for this test',
        data: [] 
      }, { status: 200 });
    }
    
    // Extract the unique module IDs that the user answered questions for
    const userModuleIds = [...new Set(
      userTestAnswers
        .filter(answer => answer.questions?.test_module_id)
        .map(answer => answer.questions.test_module_id)
    )];
    
    console.log(`User completed ${userModuleIds.length} module(s) for test ID ${testId}:`, userModuleIds);
    
    if (userModuleIds.length === 0) {
      return NextResponse.json({ 
        error: 'No modules found for this test',
        data: [] 
      }, { status: 200 });
    }
    
    // Now fetch questions for only these modules
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        id,
        question_text,
        image_url,
        difficulty,
        test_module_id,
        subject_id,
        domain_id,
        subcategory_id,
        subjects(subject_name),
        domains(domain_name),
        subcategories(subcategory_name),
        test_modules(module_number, is_harder)
      `)
      .in('test_module_id', userModuleIds)
      .order('test_module_id')
      .order('id');
      
    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }
    
    if (!questions || questions.length === 0) {
      console.error(`No questions found for modules: ${userModuleIds.join(', ')}`);
      return NextResponse.json({ error: 'No questions found for this test' }, { status: 404 });
    }
    
    console.log(`Found ${questions.length} questions for test ID ${testId}`);
    
    // Step 3: Fetch options for these questions
    const questionIds = questions.map(question => question.id);
    
    const { data: allOptions, error: optionsError } = await supabase
      .from('options')
      .select('*')
      .in('question_id', questionIds);
      
    if (optionsError) {
      console.error('Error fetching options:', optionsError);
      return NextResponse.json({ error: 'Failed to fetch question options' }, { status: 500 });
    }
    
    if (!allOptions || allOptions.length === 0) {
      console.error(`No options found for questions: ${questionIds.join(', ')}`);
      return NextResponse.json({ error: 'No options found for questions in this test' }, { status: 404 });
    }
    
    console.log(`Found ${allOptions.length} options for ${questions.length} questions`);
    
    // Step 4: Fetch user answers for this test
    const { data: userAnswers, error: userAnswersError } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_id', userId)
      .eq('test_id', testId)
      .eq('practice_type', 'test');
      
    if (userAnswersError) {
      console.error('Error fetching user answers:', userAnswersError);
      return NextResponse.json({ error: 'Failed to fetch user answers' }, { status: 500 });
    }
    
    console.log(`Found ${userAnswers?.length || 0} user answers for test ID ${testId}`);
    
    // Step 5: Combine everything
    const questionsWithOptionsAndAnswers = questions.map(question => {
      // Get options for this question
      const options = allOptions
        .filter(option => option.question_id === question.id)
        .map(option => ({
          id: option.id,
          questionId: option.question_id,
          value: option.value,
          text: option.label,
          isCorrect: option.is_correct
        }));
      
      // Get user answer for this question
      const userAnswer = userAnswers.find(answer => answer.question_id === question.id);
      
      return {
        id: question.id,
        text: question.question_text,
        imageUrl: question.image_url,
        difficulty: question.difficulty,
        moduleId: question.test_module_id,
        moduleNumber: question.test_modules?.module_number,
        isHarderModule: question.test_modules?.is_harder,
        subjectId: question.subject_id,
        domainId: question.domain_id,
        subcategoryId: question.subcategory_id,
        subjectName: question.subjects?.subject_name,
        domainName: question.domains?.domain_name,
        subcategoryName: question.subcategories?.subcategory_name,
        options,
        userAnswer: userAnswer ? {
          selectedOptionId: userAnswer.selected_option_id,
          isCorrect: userAnswer.is_correct
        } : null
      };
    });
    
    return NextResponse.json(questionsWithOptionsAndAnswers);
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}