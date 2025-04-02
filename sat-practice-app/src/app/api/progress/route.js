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

    // Get user's performance data from user_skill_analytics
    const { data: skillAnalytics, error: analyticsError } = await supabase
      .from('user_skill_analytics')
      .select('total_attempts, correct_attempts, last_practiced')
      .eq('user_id', session.user.id)
      .gte('last_practiced', startDateStr);

    if (analyticsError) {
      console.error('Error fetching skill analytics:', analyticsError);
      return NextResponse.json({ error: 'Failed to fetch skill analytics' }, { status: 500 });
    }

    // Build the base query for user_answers
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

    // Process skill analytics
    skillAnalytics.forEach(analytics => {
      const date = new Date(analytics.last_practiced).toISOString().split('T')[0];
      
      // Initialize daily stats if not exists
      if (!dailyStats[date]) {
        dailyStats[date] = {
          total: 0,
          correct: 0,
          accuracy: 0
        };
      }

      // Add skill analytics to daily stats
      dailyStats[date].total += analytics.total_attempts;
      dailyStats[date].correct += analytics.correct_attempts;
      dailyStats[date].accuracy = (dailyStats[date].correct / dailyStats[date].total) * 100;
    });

    // Process user answers
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

    // Calculate overall stats to match AnalyticsCard
    const totalQuestions = dailyData.reduce((sum, day) => sum + day.total, 0);
    const totalCorrect = dailyData.reduce((sum, day) => sum + day.correct, 0);
    const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    return NextResponse.json({
      dailyData,
      subcategoryData,
      overallStats: {
        totalQuestions,
        totalCorrect,
        accuracyPercentage: overallAccuracy
      },
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