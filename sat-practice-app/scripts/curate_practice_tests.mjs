#!/usr/bin/env node
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import { fileURLToPath } from 'url';
import path, { dirname, join } from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from project root
dotenv.config({ path: join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
  process.exit(1);
}
const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
if (!SUPABASE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY (preferred) or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const SUBJECT = { MATH: 1, RW: 2 };

const RW_COUNTS = {
  1: { easy: 10, medium: 10, hard: 7 },
  2: { easy: 12, medium: 9, hard: 6, easy_hard: 6, medium_hard: 9, hard_hard: 12 },
};
const MATH_COUNTS = {
  1: { easy: 8, medium: 8, hard: 6 },
  2: { easy: 12, medium: 8, hard: 2, easy_hard: 2, medium_hard: 8, hard_hard: 12 },
};

// Fixed domain counts per module
// Reading & Writing domain_id mapping:
// 5: Craft and Structure (8)
// 7: Information and Ideas (7)
// 8: Standard English Conventions (7)
// 6: Expression of Ideas (5)
const DOMAIN_COUNTS_RW = { 5: 8, 7: 7, 8: 7, 6: 5 };

// Math domain_id mapping:
// 2: Algebra (8)
// 1: Advanced Math (7)
// 4: Problem-Solving and Data Analysis (4)
// 3: Geometry and Trigonometry (3)
const DOMAIN_COUNTS_MATH = { 2: 8, 1: 7, 4: 4, 3: 3 };

const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

function allocateByPercent(total, pctMap) {
  const entries = Object.entries(pctMap);
  const raw = entries.map(([k, pct]) => [k, (pct / 100) * total]);
  const floors = raw.map(([k, val]) => [k, Math.floor(val)]);
  let used = floors.reduce((s, [, v]) => s + v, 0);
  let rem = total - used;
  const fracs = raw.map(([k, val], i) => [k, val - floors[i][1]]).sort((a, b) => b[1] - a[1]);
  const alloc = Object.fromEntries(floors);
  for (let i = 0; i < fracs.length && rem > 0; i++, rem--) alloc[fracs[i][0]]++;
  return alloc;
}

async function fetchPool(subjectId) {
  const pageSize = 1000;
  let from = 0;
  let to = pageSize - 1;
  const results = [];
  // Paginate until no more rows
  // Uses RLS-permitted access; service role key recommended for full access
  while (true) {
    const query = supabase
      .from('questions')
      .select('id, subject_id, domain_id, subcategory_id, difficulty', { count: 'exact', head: false })
      .eq('subject_id', subjectId)
      .is('test_module_id', null)
      .range(from, to);

    const { data, error } = await query;
    if (error) {
      throw error;
    }
    if (!data || data.length === 0) break;
    // normalize difficulty to lower-case to match prior logic
    for (const row of data) {
      results.push({ ...row, difficulty: String(row.difficulty || '').toLowerCase() });
    }
    if (data.length < pageSize) break;
    from += pageSize;
    to += pageSize;
  }
  return results;
}

function sampleModuleQuestions(pool, difficultyCounts, domainCounts) {
  const total = Object.values(difficultyCounts).reduce((s, v) => s + v, 0);
  // Clone fixed domain counts as our target per module
  const domainTarget = { ...domainCounts };

  const byDomain = new Map();
  for (const q of pool) {
    const dKey = String(q.domain_id || 'unknown');
    if (!byDomain.has(dKey)) byDomain.set(dKey, { easy: new Map(), medium: new Map(), hard: new Map() });
    const bucket = byDomain.get(dKey)[q.difficulty] || null;
    if (!bucket) continue;
    const sKey = String(q.subcategory_id || 'unknown');
    if (!bucket.has(sKey)) bucket.set(sKey, []);
    bucket.get(sKey).push(q.id);
  }
  for (const dom of byDomain.values()) {
    for (const diff of ['easy', 'medium', 'hard']) {
      for (const [s, ids] of dom[diff]) dom[diff].set(s, shuffle(ids));
    }
  }

  const result = new Set();
  const needed = { ...difficultyCounts };
  const perDomainNeeded = { ...domainTarget };

  function pickFromBuckets(domMap, diff, count) {
    if (count <= 0) return [];
    const buckets = Array.from(domMap[diff].entries()).map(([s, ids]) => ({ s, ids }));
    shuffle(buckets);
    const picks = [];
    let idx = 0;
    while (picks.length < count && buckets.length > 0) {
      const b = buckets[idx % buckets.length];
      if (b.ids.length > 0) picks.push(b.ids.pop());
      if (b.ids.length === 0) {
        buckets.splice(idx % buckets.length, 1);
        if (buckets.length === 0) break;
      } else {
        idx++;
      }
    }
    return picks;
  }

  // First pass: try to fill each domain's target, apportioning difficulties proportionally
  for (const [domainId, domCount] of Object.entries(perDomainNeeded)) {
    const domMap = byDomain.get(String(domainId));
    if (!domMap) continue;
    const diffTargets = {};
    let sum = 0;
    for (const d of ['easy', 'medium', 'hard']) { diffTargets[d] = Math.floor((needed[d] / total) * domCount); sum += diffTargets[d]; }
    while (sum < domCount) { for (const d of ['hard', 'medium', 'easy']) { if (sum < domCount) { diffTargets[d]++; sum++; } } }
    for (const d of ['easy', 'medium', 'hard']) {
      const want = Math.min(diffTargets[d], needed[d]);
      if (want <= 0) continue;
      const got = pickFromBuckets(domMap, d, want);
      for (const id of got) result.add(id);
      needed[d] -= got.length;
      perDomainNeeded[domainId] -= got.length;
    }
  }

  // Second pass: greedily fill remaining difficulty needs, but never exceed any domain target
  for (const d of ['easy', 'medium', 'hard']) {
    while (needed[d] > 0) {
      let filled = false;
      for (const [domainId, domMap] of byDomain.entries()) {
        if (perDomainNeeded[domainId] <= 0) continue;
        const buckets = Array.from(domMap[d].values());
        for (const ids of shuffle(buckets)) {
          while (ids.length && needed[d] > 0 && perDomainNeeded[domainId] > 0) {
            result.add(ids.pop()); needed[d]--; perDomainNeeded[domainId]--; filled = true;
          }
          if (needed[d] <= 0) break;
        }
      }
      if (!filled) break;
    }
  }

  // Strict satisfaction check: all difficulties and domain targets must be fully met
  const difficultySatisfied = Object.values(needed).every(v => v === 0);
  const domainSatisfied = Object.values(perDomainNeeded).every(v => v === 0);
  if (!difficultySatisfied || !domainSatisfied) {
    return { ok: false, question_ids: [] };
  }

  return { ok: true, question_ids: Array.from(result) };
}

function toCounts(subjectId, moduleNumber, isHarder) {
  if (subjectId === SUBJECT.RW) {
    if (moduleNumber === 1) return RW_COUNTS[1];
    if (moduleNumber === 2 && isHarder === false) return { easy: RW_COUNTS[2].easy, medium: RW_COUNTS[2].medium, hard: RW_COUNTS[2].hard };
    if (moduleNumber === 2 && isHarder === true) return { easy: RW_COUNTS[2].easy_hard, medium: RW_COUNTS[2].medium_hard, hard: RW_COUNTS[2].hard_hard };
  } else if (subjectId === SUBJECT.MATH) {
    if (moduleNumber === 1) return MATH_COUNTS[1];
    if (moduleNumber === 2 && isHarder === false) return { easy: MATH_COUNTS[2].easy, medium: MATH_COUNTS[2].medium, hard: MATH_COUNTS[2].hard };
    if (moduleNumber === 2 && isHarder === true) return { easy: MATH_COUNTS[2].easy_hard, medium: MATH_COUNTS[2].medium_hard, hard: MATH_COUNTS[2].hard_hard };
  }
  throw new Error('Invalid module configuration');
}

function domainCountsFor(subjectId) { return subjectId === SUBJECT.RW ? DOMAIN_COUNTS_RW : DOMAIN_COUNTS_MATH; }

async function main() {
  try {
    const allRW = await fetchPool(SUBJECT.RW);
    const allMATH = await fetchPool(SUBJECT.MATH);

    const buildAllForSubject = (subjectId, pool) => {
      const domainCounts = domainCountsFor(subjectId);
      const tests = [];
      const globalUsed = new Set();
      let testIndex = 1;

      while (true) {
        // Available pool excludes anything used by prior tests
        const available = pool.filter(q => !globalUsed.has(q.id));
        if (available.length === 0) break;

        // Module 1
        const countsM1 = toCounts(subjectId, 1, null);
        const m1 = sampleModuleQuestions(available, countsM1, domainCounts);
        if (!m1.ok) break;

        // Module 2 Easy (is_harder: false), exclude Module 1 within the same test
        const availableExM1 = available.filter(q => !m1.question_ids.includes(q.id));
        const countsM2E = toCounts(subjectId, 2, false);
        const m2e = sampleModuleQuestions(availableExM1, countsM2E, domainCounts);
        if (!m2e.ok) break;

        // Module 2 Hard (is_harder: true), also exclude Module 1 only (can overlap with m2e)
        const countsM2H = toCounts(subjectId, 2, true);
        const m2h = sampleModuleQuestions(availableExM1, countsM2H, domainCounts);
        if (!m2h.ok) break;

        const testName = subjectId === SUBJECT.RW
          ? `Reading & Writing Practice Test ${testIndex}`
          : `Math Practice Test ${testIndex}`;

        tests.push({
          subject_id: subjectId,
          name: testName,
          modules: [
            { module_number: 1, is_harder: null, question_ids: m1.question_ids },
            { module_number: 2, is_harder: false, question_ids: m2e.question_ids },
            { module_number: 2, is_harder: true, question_ids: m2h.question_ids },
          ],
        });

        // Mark all used in this test as globally used (no overlap across tests)
        for (const id of new Set([...m1.question_ids, ...m2e.question_ids, ...m2h.question_ids])) globalUsed.add(id);

        testIndex++;
      }

      return tests;
    };

    const testsRW = buildAllForSubject(SUBJECT.RW, allRW);
    const testsMATH = buildAllForSubject(SUBJECT.MATH, allMATH);

    const payload = { tests: [...testsRW, ...testsMATH] };
    console.log(JSON.stringify(payload, null, 2));
  } finally {
    // no-op
  }
}

main().catch((e) => { console.error(e); process.exit(1); });


