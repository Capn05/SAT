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
    const daysParam = searchParams.get('days') || '30';
    const subject = searchParams.get('subject');
    const difficulty = searchParams.get('difficulty');

    // Calculate the start date (or handle all-time)
    let startDateStr = null;
    if (daysParam !== 'all') {
      const days = parseInt(daysParam, 10);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDateStr = startDate.toISOString();
    }

    // Build the base query for user_answers
    let query = supabase
      .from('user_answers')
      .select(`
        id,
        answered_at,
        is_correct,
        practice_type,
        selected_option_id,
        questions!inner (
          id,
          question_text,
          image_url,
          subject_id,
          difficulty,
          domain_id,
          subcategory_id,
          domains!inner (
            id,
            domain_name
          ),
          subcategories!inner (
            subcategory_name
          )
        )
      `)
      .eq('user_id', session.user.id)
      // include all practice types
      .order('answered_at', { ascending: true });

    // Add subject filter if provided
    if (subject) {
      query = query.eq('questions.subject_id', subject);
    }

    // Add difficulty filter if provided
    if (difficulty && difficulty !== 'all') {
      query = query.eq('questions.difficulty', difficulty);
    }

    // Add date filter if not all-time
    if (startDateStr) {
      query = query.gte('answered_at', startDateStr);
    }

    const { data: answers, error: answersError } = await query;

    if (answersError) {
      console.error('Error fetching answers:', answersError);
      return NextResponse.json({ error: 'Failed to fetch progress data' }, { status: 500 });
    }

    // Process the data to get daily and domain statistics
    const dailyStats = {};
    const domainStats = {};

    // Process user answers
    answers.forEach(answer => {
      const date = new Date(answer.answered_at).toISOString().split('T')[0];
      const domain = answer.questions.domains.domain_name;
      const domainId = answer.questions.domains.id;

      // Initialize daily stats if not exists
      if (!dailyStats[date]) {
        dailyStats[date] = {
          total: 0,
          correct: 0
        };
      }

      // Initialize domain stats if not exists
      if (!domainStats[domain]) {
        domainStats[domain] = {
          domainId,
          total: 0,
          correct: 0
        };
      }

      // Update daily stats
      dailyStats[date].total++;
      if (answer.is_correct) {
        dailyStats[date].correct++;
      }

      // Update domain stats
      domainStats[domain].total++;
      if (answer.is_correct) {
        domainStats[domain].correct++;
      }
    });

    // Build answer history with question details and options
    const questionIds = Array.from(new Set((answers || [])
      .map(a => a?.questions?.id)
      .filter(Boolean)));

    let optionsByQuestionId = {};
    if (questionIds.length > 0) {
      const { data: optionsData, error: optionsError } = await supabase
        .from('options')
        .select('id, question_id, value, label, is_correct')
        .in('question_id', questionIds);

      if (!optionsError && optionsData) {
        optionsByQuestionId = optionsData.reduce((acc, opt) => {
          if (!acc[opt.question_id]) acc[opt.question_id] = [];
          acc[opt.question_id].push(opt);
          return acc;
        }, {});
      } else if (optionsError) {
        console.error('Error fetching options for answer history:', optionsError);
      }
    }

    const answerHistory = (answers || []).map(a => {
      const q = a.questions || {};
      const subjectLabel = q.subject_id === 1 ? 'Math' : 'Reading & Writing';
      const rawOptions = optionsByQuestionId[q.id] || [];
      const sortedOptions = rawOptions
        .slice()
        .sort((x, y) => (String(x.value || '')).localeCompare(String(y.value || '')));
      return {
        id: a.id,
        question_id: q.id,
        subject_id: q.subject_id,
        subject: subjectLabel,
        domain: q.domains?.domain_name || null,
        subcategory: q.subcategories?.subcategory_name || null,
        difficulty: q.difficulty,
        is_correct: a.is_correct,
        answered_at: a.answered_at,
        question_text: q.question_text,
        image_url: q.image_url,
        selected_option_id: a.selected_option_id,
        options: sortedOptions.map(o => ({
          id: o.id,
          label: o.label,
          value: o.value,
          is_correct: o.is_correct
        }))
      };
    }).sort((a, b) => new Date(b.answered_at) - new Date(a.answered_at));

    // Convert daily stats to array format for the chart
    let dailyData = Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        total: stats.total,
        correct: stats.correct
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // If we have a fixed start date (not all-time), fill missing dates with zeros
    if (startDateStr) {
      const start = new Date(startDateStr);
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(0, 0, 0, 0);

      const existingByDate = new Map(dailyData.map(d => [d.date, d]));
      const filled = [];
      for (let d = new Date(start); d.getTime() <= end.getTime(); d.setDate(d.getDate() + 1)) {
        const key = new Date(d).toISOString().split('T')[0];
        filled.push(existingByDate.get(key) || { date: key, total: 0, correct: 0 });
      }
      dailyData = filled;
    }

    // Fetch full domain list based on subject filter so we can include domains with no data
    let domainsQuery = supabase
      .from('domains')
      .select('id, domain_name, subject_id');

    if (subject && subject !== 'all') {
      domainsQuery = domainsQuery.eq('subject_id', subject);
    }

    const { data: allDomains, error: domainsError } = await domainsQuery;
    if (domainsError) {
      console.error('Error fetching domains:', domainsError);
      return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 });
    }

    // Build domain data ensuring all domains appear
    const domainData = (allDomains || []).map(dom => {
      const stats = Object.values(domainStats).find(s => s.domainId === dom.id) || { total: 0, correct: 0 };
      const total = stats.total || 0;
      const correct = stats.correct || 0;
      return {
        domain: dom.domain_name,
        domain_id: dom.id,
        total,
        correct,
        accuracy: total > 0 ? (correct / total) * 100 : 0
      };
    });

    // Calculate overall stats to match AnalyticsCard
    const totalQuestions = dailyData.reduce((sum, day) => sum + day.total, 0);
    const totalCorrect = dailyData.reduce((sum, day) => sum + day.correct, 0);
    const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    return NextResponse.json({
      dailyData,
      domainData,
      domains: domainData.map(d => d.domain),
      answerHistory,
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