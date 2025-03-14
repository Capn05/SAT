import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const difficulty = searchParams.get('difficulty') || 'mixed';

    console.log('Fetching quick practice questions for subject:', subject);

    if (!subject) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }

    // Get user's skill analytics to prioritize questions from weaker areas
    const { data: skillAnalytics, error: analyticsError } = await supabase
      .from('user_skill_analytics')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('subject_id', subject);

    if (analyticsError) {
      console.error('Error fetching skill analytics:', analyticsError);
      return NextResponse.json({ error: 'Failed to fetch user analytics' }, { status: 500 });
    }

    // Create a map of subcategory IDs to their mastery level
    const subcategoryMastery = new Map();
    skillAnalytics?.forEach(record => {
      const masteryScore = 
        record.mastery_level === 'Needs Practice' ? 1 :
        record.mastery_level === 'Needs More Attempts' ? 2 :
        record.mastery_level === 'On Track' ? 3 :
        record.mastery_level === 'Mastered' ? 4 : 0;
      subcategoryMastery.set(record.subcategory_id, masteryScore);
    });

    // Get questions with their domain and subcategory information
    let query = supabase
      .from('questions')
      .select(`
        *,
        options(*),
        domains!inner (
          id,
          domain_name
        ),
        subcategories!inner (
          id,
          subcategory_name
        )
      `)
      .eq('subject_id', subject);

    // Add difficulty filter if specified
    if (difficulty && difficulty !== 'mixed') {
      const capitalizedDifficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
      query = query.eq('difficulty', capitalizedDifficulty);
    }

    const { data: allQuestions, error: questionsError } = await query;

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    if (!allQuestions || allQuestions.length === 0) {
      return NextResponse.json({ 
        questions: [],
        message: 'No questions available for this subject' 
      });
    }

    // Sort questions by priority:
    // 1. Questions from subcategories with lower mastery levels
    // 2. Random within each mastery level
    const sortedQuestions = allQuestions.sort((a, b) => {
      const masteryA = subcategoryMastery.get(a.subcategory_id) || 0;
      const masteryB = subcategoryMastery.get(b.subcategory_id) || 0;
      
      if (masteryA !== masteryB) {
        return masteryA - masteryB; // Lower mastery scores first
      }
      
      return Math.random() - 0.5; // Random within same mastery level
    });

    // Take the first 15 questions
    const selectedQuestions = sortedQuestions.slice(0, 15).map(q => ({
      ...q,
      domain_name: q.domains.domain_name,
      subcategory_name: q.subcategories.subcategory_name,
      options: q.options.sort(() => Math.random() - 0.5) // Shuffle options
    }));

    console.log(`Returning ${selectedQuestions.length} questions for quick practice`);
    
    return NextResponse.json({ questions: selectedQuestions });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
} 