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

    // Get the date range from query parameters, default to last 30 days
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const subject = searchParams.get('subject');

    // Calculate the start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString();

    // Build the base query
    let query = supabase
      .from('user_answers')
      .select(`
        answered_at,
        is_correct,
        practice_type,
        questions!inner (
          subject_id,
          domains!inner (
            domain_name
          ),
          subcategories!inner (
            subcategory_name
          )
        )
      `)
      .eq('user_id', session.user.id)
      .gte('answered_at', startDateStr)
      .or(`practice_type.eq.quick,practice_type.eq.skills,practice_type.eq.test`)
      .order('answered_at', { ascending: true });

    // Add subject filter if provided
    if (subject) {
      query = query.eq('questions.subject_id', subject);
    }

    const { data: answers, error: answersError } = await query;

    if (answersError) {
      console.error('Error fetching answers:', answersError);
      return NextResponse.json({ error: 'Failed to fetch progress data' }, { status: 500 });
    }

    // Process the data to get daily statistics
    const dailyStats = {};
    const subcategoryStats = {};

    answers.forEach(answer => {
      const date = new Date(answer.answered_at).toISOString().split('T')[0];
      const subcategory = answer.questions.subcategories.subcategory_name;
      const domain = answer.questions.domains.domain_name;

      // Initialize daily stats if not exists
      if (!dailyStats[date]) {
        dailyStats[date] = {
          total: 0,
          correct: 0,
          accuracy: 0
        };
      }

      // Initialize subcategory stats if not exists
      if (!subcategoryStats[subcategory]) {
        subcategoryStats[subcategory] = {
          domain,
          total: 0,
          correct: 0,
          accuracy: 0
        };
      }

      // Update daily stats
      dailyStats[date].total++;
      if (answer.is_correct) {
        dailyStats[date].correct++;
      }
      dailyStats[date].accuracy = (dailyStats[date].correct / dailyStats[date].total) * 100;

      // Update subcategory stats
      subcategoryStats[subcategory].total++;
      if (answer.is_correct) {
        subcategoryStats[subcategory].correct++;
      }
      subcategoryStats[subcategory].accuracy = 
        (subcategoryStats[subcategory].correct / subcategoryStats[subcategory].total) * 100;
    });

    // Convert daily stats to array format for the chart
    const dailyData = Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      ...stats
    }));

    // Convert subcategory stats to array format
    const subcategoryData = Object.entries(subcategoryStats).map(([name, stats]) => ({
      name,
      ...stats
    }));

    return NextResponse.json({
      dailyData,
      subcategoryData,
      dateRange: {
        start: startDateStr,
        end: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 