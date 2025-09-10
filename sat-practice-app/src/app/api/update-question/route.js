import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { type, id, data } = body;

    console.log('API: Received update request:', { type, id, data });
    console.log('API: User ID:', session.user.id);

    if (type === 'question') {
      // First check if question exists
      console.log('API: Checking if question exists with ID:', id);
      const { data: existingQuestion, error: checkError } = await supabase
        .from('new_questions')
        .select('id, question_text, difficulty')
        .eq('id', id)
        .single();
      
      console.log('API: Existing question check:', { existingQuestion, checkError });
      
      if (checkError || !existingQuestion) {
        console.error('API: Question not found:', checkError);
        return NextResponse.json({ 
          error: 'Question not found',
          details: checkError || 'Question ID does not exist'
        }, { status: 404 });
      }
      
      // Update question
      console.log('API: Updating question with data:', {
        question_text: data.question_text,
        difficulty: data.difficulty,
        image_url: data.image_url || null
      });
      
      const { data: updateResult, error: updateError } = await supabase
        .from('new_questions')
        .update({
          question_text: data.question_text,
          difficulty: data.difficulty,
          image_url: data.image_url || null
        })
        .eq('id', id)
        .select();

      console.log('API: Update result:', updateResult);

      if (updateError) {
        console.error('API: Error updating question:', updateError);
        return NextResponse.json({ 
          error: 'Failed to update question',
          details: updateError
        }, { status: 500 });
      }

      if (!updateResult || updateResult.length === 0) {
        console.error('API: No rows were updated - question may not exist or no permission');
        return NextResponse.json({ 
          error: 'Question not found or no permission to update',
          details: 'No rows affected'
        }, { status: 404 });
      }

      // Fetch updated question to return
      const { data: updatedQuestion, error: fetchError } = await supabase
        .from('new_questions')
        .select(`
          *,
          new_options(*),
          subjects(subject_name),
          domains(domain_name),
          subcategories(subcategory_name)
        `)
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching updated question:', fetchError);
        return NextResponse.json({ 
          error: 'Question updated but failed to fetch updated data',
          details: fetchError
        }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Question updated successfully',
        question: updatedQuestion
      });

    } else if (type === 'option') {
      // First check if option exists
      console.log('API: Checking if option exists with ID:', id);
      const { data: existingOption, error: checkError } = await supabase
        .from('new_options')
        .select('id, label, is_correct')
        .eq('id', id)
        .single();
      
      console.log('API: Existing option check:', { existingOption, checkError });
      
      if (checkError || !existingOption) {
        console.error('API: Option not found:', checkError);
        return NextResponse.json({ 
          error: 'Option not found',
          details: checkError || 'Option ID does not exist'
        }, { status: 404 });
      }
      
      // Update option
      console.log('API: Updating option with data:', {
        label: data.label,
        is_correct: data.is_correct
      });
      
      const { data: updateResult, error: updateError } = await supabase
        .from('new_options')
        .update({
          label: data.label,
          is_correct: data.is_correct
        })
        .eq('id', id)
        .select();

      console.log('API: Option update result:', updateResult);

      if (updateError) {
        console.error('API: Error updating option:', updateError);
        return NextResponse.json({ 
          error: 'Failed to update option',
          details: updateError
        }, { status: 500 });
      }

      if (!updateResult || updateResult.length === 0) {
        console.error('API: No option rows were updated - option may not exist or no permission');
        return NextResponse.json({ 
          error: 'Option not found or no permission to update',
          details: 'No rows affected'
        }, { status: 404 });
      }

      // Fetch updated option to return
      const { data: updatedOption, error: fetchError } = await supabase
        .from('new_options')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching updated option:', fetchError);
        return NextResponse.json({ 
          error: 'Option updated but failed to fetch updated data',
          details: fetchError
        }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Option updated successfully',
        option: updatedOption
      });

    } else {
      return NextResponse.json({ error: 'Invalid update type' }, { status: 400 });
    }

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
