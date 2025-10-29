import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import OpenAI from 'openai';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

// Prefer server-side key
const openaiApiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPEN_AI_API_KEY;
if (!openaiApiKey) {
  console.error('Missing OpenAI API key. Set NEXT_PUBLIC_OPEN_AI_API_KEY or OPENAI_API_KEY in .env.local');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: openaiApiKey });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/__+/g, '_');
}

async function getSubcategoryContext(subcategoryId) {
  const { data, error } = await supabase
    .from('subcategories')
    .select(`
      id,
      subcategory_name,
      domain_id,
      domains(
        id,
        domain_name,
        subject_id,
        subjects(
          id,
          subject_name
        )
      )
    `)
    .eq('id', subcategoryId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error(`Subcategory ${subcategoryId} not found`);

  return {
    subcategoryId: data.id,
    subcategoryName: data.subcategory_name,
    domainId: data.domain_id,
    domainName: data.domains?.domain_name,
    subjectId: data.domains?.subjects?.id,
    subjectName: data.domains?.subjects?.subject_name,
  };
}

function loadRepresentativeExamples(subcategoryName, difficulty, limit = 5) {
  const slug = slugify(subcategoryName);
  const filePath = join(__dirname, '../generated-exports', `${slug}_${difficulty}.json`);
  try {
    if (!existsSync(filePath)) return '[]';
    const raw = readFileSync(filePath, 'utf8');
    // Truncate examples to keep prompt compact
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return JSON.stringify(arr.slice(0, limit));
      }
    } catch {}
    return raw;
  } catch {
    return '[]';
  }
}

function loadExamplesBundle(subcategoryName, perDifficultyLimit = 5) {
  const easy = loadRepresentativeExamples(subcategoryName, 'Easy', perDifficultyLimit);
  const medium = loadRepresentativeExamples(subcategoryName, 'Medium', perDifficultyLimit);
  const hard = loadRepresentativeExamples(subcategoryName, 'Hard', perDifficultyLimit);
  return { easy, medium, hard };
}

function buildPrompt(ctx, difficulty, examplesBundle, requestedN) {
  const system = `System:\nYou generate SAT/PSAT-style multiple-choice questions.`;

  const user = `User:\nCreate N = ${requestedN} new questions for:
- Subject: ${ctx.subjectName} (subject_id=${ctx.subjectId})
- Domain: ${ctx.domainName} (domain_id=${ctx.domainId})
- Subcategory: ${ctx.subcategoryName} (subcategory_id=${ctx.subcategoryId})
- Difficulty: ${difficulty} // Easy | Medium | Hard

Constraints and style:
- SAT/PSAT style, scoped strictly to this subcategory.
- Use LaTeX in question_text for math: inline uses $, block math uses $$. Use single backslash for special characters, for example, "The book costs $\$8$ and was $20\%$ off." Also, always use \frac{}{} for fractions (not tfrac or dfrac). Be sure to use single backslash for all LaTeX commands (not double backslash).
- 4 options per question with values 'A','B','C','D'. Exactly one has is_correct=true.
- Options' label strings should render cleanly in LaTeX (no stray $ or unmatched braces).
- image_url is always null. Do not make questions that rely on images since we have no way of rendering images.
- Do not reword or copy existing questions; vary structures and contexts.
- Match the requested difficulty with realistic distractors.

Representative examples from this exact subcategory (JSON from our DB). Include up to 5 from each difficulty to illustrate differences:
Easy examples (up to 5):
${examplesBundle.easy}

Medium examples (up to 5):
${examplesBundle.medium}

Hard examples (up to 5):
${examplesBundle.hard}

Output JSON schema (must be EXACTLY this shape):
{
"questions": [
{
"id": "<uuid-v4>",
"subject_id": ${ctx.subjectId},
"domain_id": ${ctx.domainId},
"subcategory_id": ${ctx.subcategoryId},
"difficulty": "${difficulty}",
"question_text": "… LaTeX-friendly prompt …",
"image_url": null,
"test_module_id": null
}
],
"options": [
{ "id": "<uuid-v4>", "question_id": "<same-question-uuid>", "value": "A", "label": "…", "is_correct": false },
{ "id": "<uuid-v4>", "question_id": "<same-question-uuid>", "value": "B", "label": "…", "is_correct": true },
{ "id": "<uuid-v4>", "question_id": "<same-question-uuid>", "value": "C", "label": "…", "is_correct": false },
{ "id": "<uuid-v4>", "question_id": "<same-question-uuid>", "value": "D", "label": "…", "is_correct": false }
]
}

Rules for correctness:
- Exactly one option per question has is_correct=true (don't make all correct answer options always value=B, mix it up and make them a roughly even split of A, B, C, and D for example.
- Labels must be capital A-D.
- All question ids are UUIDs and referenced by their options.
- Keep outputs valid JSON (no trailing commas, no comments).

Important: Generate questions ONLY for difficulty = ${difficulty}. Use the examples to calibrate difficulty level; do not output questions outside the requested difficulty. Also, for Reading & Writing questions, be sure to make unique themes and stories to the ones seen in the samples so that there is a diverse suite of texts that cover different topics and disciplines.`;

  return { system, user };
}

async function callModel(system, user) {
  // Use SDK Responses API first (per docs)
  try {
    if (openai.responses && typeof openai.responses.create === 'function') {
      const resp = await openai.responses.create({
        model: 'gpt-5',
        input: `${system}\n\n${user}`,
        max_output_tokens: null,
      });
      if (typeof resp.output_text === 'string' && resp.output_text.trim()) {
        return resp.output_text.trim();
      }
      if (Array.isArray(resp.output)) {
        const parts = [];
        for (const item of resp.output) {
          const content = Array.isArray(item?.content) ? item.content : [];
          for (const c of content) {
            if ((c?.type === 'output_text' || c?.type === 'text') && typeof c.text === 'string') {
              parts.push(c.text);
            }
          }
        }
        const combined = parts.join('').trim();
        if (combined) return combined;
      }
      throw new Error('No content returned by model');
    }
  } catch (e) {
    console.warn('SDK responses.create failed, falling back to REST:', e?.message || e);
  }

  // REST fallback to Responses API
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5',
      input: `${system}\n\n${user}`,
      reasoning: { effort: 'low' },
      text: { verbosity: 'low' },
      max_output_tokens: null,
    })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${errText}`);
  }
  const json = await res.json();
  if (typeof json.output_text === 'string' && json.output_text.trim()) {
    return json.output_text.trim();
  }
  if (Array.isArray(json.output)) {
    const parts = [];
    for (const item of json.output) {
      const content = Array.isArray(item?.content) ? item.content : [];
      for (const c of content) {
        if ((c?.type === 'output_text' || c?.type === 'text') && typeof c.text === 'string') {
          parts.push(c.text);
        }
      }
    }
    const combined = parts.join('').trim();
    if (combined) return combined;
  }
  // Save raw response for debugging
  try {
    const outDir = join(__dirname, '../generated-ai');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'last_response.json'), JSON.stringify(json, null, 2));
  } catch {}
  throw new Error('No content returned by model');
}

function ensureJson(text) {
  // Attempt to extract JSON if wrapped in code fences
  const fenceMatch = text.match(/```json\s*[\s\S]*?```/i) || text.match(/```[\s\S]*?```/);
  const raw = fenceMatch ? fenceMatch[0].replace(/```json|```/gi, '').trim() : text;
  return JSON.parse(raw);
}

async function generateFor(subcategoryId, difficulty, requestedN) {
  const ctx = await getSubcategoryContext(subcategoryId);
  const n = Number.isFinite(Number(requestedN)) ? Number(requestedN) : 3;
  const examplesBundle = loadExamplesBundle(ctx.subcategoryName, 5);
  const { system, user } = buildPrompt(ctx, difficulty, examplesBundle, n);

  console.log(`Generating questions for subcategory ${subcategoryId} (${ctx.subcategoryName}), difficulty ${difficulty}, N=${n}...`);

  console.log('===== GPT-5 PROMPT START =====');
  console.log(system);
  console.log('');
  console.log(user);
  console.log('===== GPT-5 PROMPT END =====');

  const outputText = await callModel(system, user);
  let json;
  try {
    json = ensureJson(outputText);
  } catch (e) {
    console.error('Failed to parse model output as JSON. Saving raw output for inspection.');
    const outDir = join(__dirname, '../generated-ai');
    mkdirSync(outDir, { recursive: true });
    const slug = slugify(ctx.subcategoryName);
    writeFileSync(join(outDir, `${slug}_${difficulty}_RAW.txt`), outputText, 'utf8');
    throw e;
  }

  const outDir = join(__dirname, '../generated-ai');
  mkdirSync(outDir, { recursive: true });
  const slug = slugify(ctx.subcategoryName);
  const outPath = join(outDir, `${slug}_${difficulty}.json`);
  writeFileSync(outPath, JSON.stringify(json, null, 2));
  console.log('Wrote', outPath);
}

async function main() {
  // Modes:
  // 1) Single: --subcategory=<id> --difficulty=<Easy|Medium|Hard>
  // 2) Batch: --pairs-json=/abs/path/to/pairs.json

  const argPairs = process.argv.find(a => a.startsWith('--pairs-json='));
  if (argPairs) {
    const filePath = argPairs.split('=')[1];
    const raw = readFileSync(filePath, 'utf8');
    const arr = JSON.parse(raw);

    const requestedN = Number(process.env.AI_GEN_N || 3);

    for (const entry of arr) {
      const subcategoryId = Number(entry.subcategory_id);
      const difficulty = String(entry.difficulty || '').trim();
      const count = Number(entry.question_count || 0);
      if (!subcategoryId || !difficulty) continue;

      // Filter to Reading & Writing only (subject_id = 2) via DB context
      const ctx = await getSubcategoryContext(subcategoryId);
      if (ctx.subjectId !== 2) continue;
      if (count >= 15) continue;

      await generateFor(subcategoryId, difficulty, requestedN);
    }
    return;
  }

  // Fallback single-run mode
  const argSub = process.argv.find(a => a.startsWith('--subcategory='));
  const argDiff = process.argv.find(a => a.startsWith('--difficulty='));
  const subcategoryId = argSub ? Number(argSub.split('=')[1]) : 9;
  const difficulty = argDiff ? argDiff.split('=')[1] : 'Medium';
  const requestedN = Number(process.env.AI_GEN_N || 10);
  await generateFor(subcategoryId, difficulty, requestedN);
}

await main();


