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
    
    const { 
      practice_test_id, 
      module1_answers, 
      module2_answers, 
      module1_score, 
      module2_score,
      used_harder_module 
    } = requestData;
    
    if (!practice_test_id || !module1_answers || !module2_answers) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }
    
    // Calculate total score as an average of the two modules
    const total_score = (module1_score + module2_score) / 2;
    
    // 1. Record the test analytics
    const { data: testAnalytics, error: analyticsError } = await supabase
      .from('user_test_analytics')
      .insert({
        user_id,
        practice_test_id,
        module1_score,
        module2_score,
        used_harder_module,
        total_score,
        taken_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (analyticsError) {
      console.error('Error recording test analytics:', analyticsError);
      return NextResponse.json({ error: 'Failed to record test analytics' }, { status: 500 });
    }
    
    // 2. Process all answers - combine answers from both modules
    const allAnswers = [...module1_answers, ...module2_answers];
    
    // Process each answer
    const userAnswersPromises = allAnswers.map(async (answer) => {
      const { question_id, selected_option_id, is_correct } = answer;
      
      return supabase
        .from('user_answers')
        .insert({
          user_id,
          question_id,
          selected_option_id,
          is_correct,
          practice_type: 'test',
          test_id: practice_test_id,
          answered_at: new Date().toISOString()
        });
    });
    
    // Wait for all answers to be recorded
    const answersResults = await Promise.all(userAnswersPromises);
    
    // Check for errors in answers recording
    const answerErrors = answersResults.filter(result => result.error);
    if (answerErrors.length > 0) {
      console.error('Errors recording answers:', answerErrors);
      // We continue despite some errors to ensure test completion is recorded
    }
    
    // 3. Update skill analytics for each question
    // Get the skill areas (subcategories) for all questions
    const questionIds = allAnswers.map(a => a.question_id);
    
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, subject_id, domain_id, subcategory_id')
      .in('id', questionIds);
    
    if (questionsError) {
      console.error('Error fetching question details:', questionsError);
      // Continue despite this error
    }
    
    // Group the answers by subcategory for updating user_skill_analytics
    if (questions && questions.length > 0) {
      const skillUpdates = {};
      
      // Process each answer to build the skill updates
      for (const answer of allAnswers) {
        const question = questions.find(q => q.id === answer.question_id);
        if (!question) continue;
        
        const { subject_id, domain_id, subcategory_id } = question;
        if (!subcategory_id) continue;
        
        // Create an entry for this subcategory if it doesn't exist
        if (!skillUpdates[subcategory_id]) {
          skillUpdates[subcategory_id] = {
            subject_id,
            domain_id,
            subcategory_id,
            total_attempts: 0,
            correct_attempts: 0
          };
        }
        
        // Update the counts
        skillUpdates[subcategory_id].total_attempts += 1;
        if (answer.is_correct) {
          skillUpdates[subcategory_id].correct_attempts += 1;
        }
      }
      
      // Update each skill area
      for (const subcategory_id in skillUpdates) {
        const update = skillUpdates[subcategory_id];
        
        // Calculate mastery level
        const accuracy = update.total_attempts > 0 
          ? (update.correct_attempts / update.total_attempts) * 100 
          : 0;
        
        let mastery_level = 'needs_work';
        if (accuracy >= 90) mastery_level = 'mastered';
        else if (accuracy >= 80) mastery_level = 'proficient';
        else if (accuracy >= 60) mastery_level = 'improving';
        
        // Get current skill analytics to update
        const { data: currentSkill, error: skillError } = await supabase
          .from('user_skill_analytics')
          .select('*')
          .eq('user_id', user_id)
          .eq('subcategory_id', subcategory_id)
          .single();
        
        if (skillError && skillError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error(`Error fetching skill for subcategory ${subcategory_id}:`, skillError);
          continue;
        }
        
        // If exists, update it; otherwise insert new
        if (currentSkill) {
          const { error: updateError } = await supabase
            .from('user_skill_analytics')
            .update({
              total_attempts: currentSkill.total_attempts + update.total_attempts,
              correct_attempts: currentSkill.correct_attempts + update.correct_attempts,
              last_practiced: new Date().toISOString(),
              mastery_level
            })
            .eq('id', currentSkill.id);
          
          if (updateError) {
            console.error(`Error updating skill for subcategory ${subcategory_id}:`, updateError);
          }
        } else {
          const { error: insertError } = await supabase
            .from('user_skill_analytics')
            .insert({
              user_id,
              subject_id: update.subject_id,
              domain_id: update.domain_id,
              subcategory_id,
              total_attempts: update.total_attempts,
              correct_attempts: update.correct_attempts,
              last_practiced: new Date().toISOString(),
              mastery_level
            });
          
          if (insertError) {
            console.error(`Error inserting skill for subcategory ${subcategory_id}:`, insertError);
          }
        }
      }
    }
    
    // 4. Return success response with summary
    return NextResponse.json({
      success: true,
      testSummary: {
        id: testAnalytics.id,
        score: total_score,
        module1Score: module1_score,
        module2Score: module2_score,
        usedHarderModule: used_harder_module,
        correctAnswers: allAnswers.filter(a => a.is_correct).length,
        incorrectAnswers: allAnswers.filter(a => !a.is_correct).length,
        totalQuestions: allAnswers.length
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 