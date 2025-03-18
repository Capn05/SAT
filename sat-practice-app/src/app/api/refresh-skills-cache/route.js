import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { userId, subject } = await request.json();

    // Verify the user is requesting their own data
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all domains and subcategories for this subject
    const { data: domains, error: domainsError } = await supabase
      .from('domains')
      .select(`
        id,
        domain_name,
        subcategories (
          id,
          subcategory_name
        )
      `)
      .eq('subject_id', subject);

    if (domainsError) {
      console.error('Error fetching domains:', domainsError);
      return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 });
    }

    // Fetch all user answers for this user
    const { data: userAnswers, error: answerError } = await supabase
      .from('user_answers')
      .select(`
        question_id,
        is_correct,
        practice_type,
        questions!inner (
          id,
          subject_id,
          domain_id,
          subcategory_id
        )
      `)
      .eq('user_id', userId)
      .or(`practice_type.eq.quick,practice_type.eq.skills,practice_type.eq.test`);

    if (answerError) {
      console.error('Error fetching answers:', answerError);
      return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 });
    }

    // Log answer counts by practice type for debugging
    const practiceTypeCounts = userAnswers.reduce((acc, answer) => {
      const type = answer.practice_type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('Answer counts by practice type:', practiceTypeCounts);
    console.log('Total answers considered for skill analytics:', userAnswers.length);

    // Process each domain and its subcategories
    for (const domain of domains) {
      for (const subcategory of domain.subcategories) {
        // Filter answers for this subcategory
        const subcategoryAnswers = userAnswers.filter(a => 
          a.questions.subcategory_id === subcategory.id
        );
        
        // Get unique question attempts
        const uniqueAttempts = new Map();
        subcategoryAnswers.forEach(answer => {
          if (!uniqueAttempts.has(answer.question_id)) {
            uniqueAttempts.set(answer.question_id, answer.is_correct);
          }
        });

        const totalAttempts = uniqueAttempts.size;
        const correctAnswers = Array.from(uniqueAttempts.values()).filter(isCorrect => isCorrect).length;
        const accuracyPercentage = totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0;

        // Determine mastery level based on documentation, with special handling for 100% accuracy
        let masteryLevel;
        if (accuracyPercentage === 100 && totalAttempts > 0) {
          // Always show mastered for 100% accuracy with at least one attempt
          masteryLevel = 'mastered';
        } else if (totalAttempts < 5) {
          // For skills with fewer than 5 attempts, use a simplified mastery scale
          if (accuracyPercentage >= 80) {
            masteryLevel = 'proficient';
          } else if (accuracyPercentage >= 50) {
            masteryLevel = 'improving';
          } else {
            masteryLevel = 'needs_work';
          }
        } else {
          // Standard mastery calculation for 5+ attempts
          if (accuracyPercentage >= 90) {
            masteryLevel = 'mastered';
          } else if (accuracyPercentage >= 80) {
            masteryLevel = 'proficient';
          } else if (accuracyPercentage >= 60) {
            masteryLevel = 'improving';
          } else {
            masteryLevel = 'needs_work';
          }
        }

        // Update user_skill_analytics
        const { error: updateError } = await supabase
          .from('user_skill_analytics')
          .upsert({
            user_id: userId,
            subject_id: subject,
            domain_id: domain.id,
            subcategory_id: subcategory.id,
            total_attempts: totalAttempts,
            correct_attempts: correctAnswers,
            last_practiced: totalAttempts > 0 ? new Date().toISOString() : null,
            mastery_level: masteryLevel
          }, {
            onConflict: 'user_id,subcategory_id'
          });

        if (updateError) {
          console.error('Error updating analytics for subcategory:', subcategory.subcategory_name, updateError);
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Skills cache refreshed successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
} 