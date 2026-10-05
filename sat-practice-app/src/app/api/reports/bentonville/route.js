import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin/service client (no cookies) so we can access auth and cross-user data
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

const DEFAULT_DOMAIN = '@bentonvillek12.org';
const DEFAULT_START_ISO = '2025-09-09T17:00:00.000Z';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const emailDomain = (searchParams.get('emailDomain') || DEFAULT_DOMAIN).toLowerCase();
    const startIso = searchParams.get('start') || DEFAULT_START_ISO;

    // Optional: allow filtering down to a single userId or email
    const userIdFilter = searchParams.get('userId') || null;
    const emailFilter = (searchParams.get('email') || '').toLowerCase() || null;

    // Gather users with the specified email domain (or specific email)
    const userIdToEmail = new Map();

    // If a specific userId/email is provided, try to resolve it first to avoid listing all users
    if (userIdFilter || emailFilter) {
      if (userIdFilter) {
        // Fetch the user via admin list and match by id
        const { data: page1, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        if (listErr) {
          return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
        }
        const match = (page1.users || []).find(u => u.id === userIdFilter);
        if (match && (!emailFilter || (match.email || '').toLowerCase() === emailFilter)) {
          userIdToEmail.set(match.id, (match.email || ''));
        }
      } else if (emailFilter) {
        // Page through users and find the one email
        let page = 1;
        const perPage = 1000;
        // Cap at 20 pages to be safe
        while (page <= 20) {
          const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
          if (error) {
            return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
          }
          const found = (data.users || []).find(u => (u.email || '').toLowerCase() === emailFilter);
          if (found) {
            userIdToEmail.set(found.id, (found.email || ''));
            break;
          }
          if (!data.users || data.users.length < perPage) break;
          page += 1;
        }
      }
    }

    // If no specific user was found/provided, gather all users with the domain
    if (userIdToEmail.size === 0) {
      let page = 1;
      const perPage = 1000;
      while (page <= 20) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
        if (error) {
          return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
        }
        for (const u of data.users || []) {
          const emailLower = (u.email || '').toLowerCase();
          if (emailLower.endsWith(emailDomain)) {
            userIdToEmail.set(u.id, u.email || '');
          }
        }
        if (!data.users || data.users.length < perPage) break;
        page += 1;
      }
    }

    const userIds = Array.from(userIdToEmail.keys());
    if (userIds.length === 0) {
      return NextResponse.json({ users: [], answers: [] });
    }

    // Chunk userIds to avoid very large IN() lists
    const chunkSize = 1000;
    const chunks = [];
    for (let i = 0; i < userIds.length; i += chunkSize) {
      chunks.push(userIds.slice(i, i + chunkSize));
    }

    const allAnswers = [];
    for (const ids of chunks) {
      let query = supabaseAdmin
        .from('user_answers')
        .select(`
          id,
          user_id,
          question_id,
          answered_at,
          is_correct,
          questions!inner (
            subject_id,
            difficulty,
            domains!inner (
              id,
              domain_name
            ),
            subcategories!inner (
              id,
              subcategory_name
            )
          )
        `)
        .in('user_id', ids)
        .gte('answered_at', startIso)
        .order('answered_at', { ascending: true });

      const { data, error } = await query;
      if (error) {
        return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 });
      }
      if (data) allAnswers.push(...data);
    }

    // Normalize answers into a compact payload
    const answers = (allAnswers || []).map(a => {
      const q = a.questions || {};
      return {
        id: a.id,
        user_id: a.user_id,
        question_id: a.question_id,
        answered_at: a.answered_at,
        is_correct: !!a.is_correct,
        subject_id: q.subject_id ?? null,
        difficulty: q.difficulty ?? null,
        domain_id: q.domains?.id ?? null,
        domain: q.domains?.domain_name ?? null,
        subcategory_id: q.subcategories?.id ?? null,
        subcategory: q.subcategories?.subcategory_name ?? null
      };
    });

    const users = userIds.map(id => ({ id, email: userIdToEmail.get(id) || '' }));

    return NextResponse.json({
      users,
      answers,
      filters: {
        emailDomain,
        start: startIso,
        totalUsers: users.length
      }
    });
  } catch (error) {
    console.error('Bentonville reports API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


