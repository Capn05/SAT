import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync, readFileSync, statSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env from app .env.local (same pattern as other scripts)
dotenv.config({ path: join(__dirname, '../.env.local') });

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

function isJsonFile(file) {
  return file.toLowerCase().endsWith('.json');
}

function readJson(filePath) {
  const raw = readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`Invalid JSON in ${filePath}: ${e.message}`);
  }
}

async function insertQuestionIntoNewTable(question) {
  // Map JSON fields to DB columns for new_questions
  const payload = {
    id: undefined, // will be filled by caller
    question_text: question.question_text,
    image_url: question.image_url ?? null,
    difficulty: question.difficulty,
    test_module_id: question.test_module_id ?? null,
    subject_id: question.subject_id,
    domain_id: question.domain_id,
    subcategory_id: question.subcategory_id,
  };

  const { data, error } = await supabase
    .from('new_questions')
    .insert(payload)
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

async function insertOptionsForQuestion(newQuestionId, allOptions, sourceQuestionUuid) {
  // Filter options belonging to this source question UUID if present
  const optionsForQuestion = Array.isArray(allOptions)
    ? allOptions.filter(o => o.question_id === sourceQuestionUuid)
    : [];

  if (optionsForQuestion.length === 0) return 0;

  const rows = optionsForQuestion.map(o => ({
    id: undefined, // will be filled by caller
    question_id: newQuestionId,
    value: o.value,
    label: o.label,
    is_correct: !!o.is_correct,
  }));

  // Actual insert happens in caller after IDs are set
  return rows;
}

async function processFile(filePath) {
  const json = readJson(filePath);
  const questions = Array.isArray(json?.questions) ? json.questions : [];
  const options = Array.isArray(json?.options) ? json.options : [];

  if (questions.length === 0) {
    console.warn(`[skip] No questions found in ${filePath}`);
    return { insertedQuestions: 0, insertedOptions: 0 };
  }

  let insertedQuestions = 0;
  let insertedOptions = 0;

  // Resolve next IDs for questions
  if (typeof globalThis.__nextQuestionId === 'undefined') {
    try {
      const { data: maxRow } = await supabase
        .from('new_questions')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();
      globalThis.__nextQuestionId = (maxRow?.id ?? 0) + 1;
    } catch {
      globalThis.__nextQuestionId = 1;
    }
  }

  // Always target new_options (no fallback)
  globalThis.__optionsTable = 'new_options';

  if (typeof globalThis.__nextOptionId === 'undefined') {
    const { data: maxOpt } = await supabase
      .from(globalThis.__optionsTable)
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();
    globalThis.__nextOptionId = (maxOpt?.id ?? 0) + 1;
  }

  for (const q of questions) {
    try {
      // Insert question with explicit integer id
      const newId = globalThis.__nextQuestionId++;
      const newPayload = {
        id: newId,
        question_text: q.question_text,
        image_url: q.image_url ?? null,
        difficulty: q.difficulty,
        test_module_id: q.test_module_id ?? null,
        subject_id: q.subject_id,
        domain_id: q.domain_id,
        subcategory_id: q.subcategory_id,
      };
      const { error: qErr } = await supabase
        .from('new_questions')
        .insert(newPayload);
      if (qErr) throw qErr;
      insertedQuestions += 1;

      // Prepare option rows and assign explicit ids
      const optionRows = await insertOptionsForQuestion(newId, options, q.id);
      if (optionRows.length > 0) {
        for (const row of optionRows) {
          row.id = globalThis.__nextOptionId++;
        }
        const { error: oErr } = await supabase
          .from(globalThis.__optionsTable)
          .insert(optionRows);
        if (oErr) throw oErr;
        insertedOptions += optionRows.length;
      }
    } catch (e) {
      console.error(`[error] Failed to insert question from ${filePath}:`, e?.message || e);
    }
  }

  return { insertedQuestions, insertedOptions };
}

async function main() {
  const dir = join(__dirname, '../generated-ai');
  let files;
  try {
    files = readdirSync(dir);
  } catch (e) {
    console.error('Failed to read generated-ai directory:', dir, e?.message || e);
    process.exit(1);
  }

  const jsonFiles = files.filter(f => {
    const p = join(dir, f);
    if (!isJsonFile(f) || !statSync(p).isFile()) return false;
    const lower = f.toLowerCase();
    if (lower === 'last_response.json' || lower === 'rw_pairs.json') return false;
    return true;
  });

  if (jsonFiles.length === 0) {
    console.log('No JSON files found in generated-ai/. Nothing to upload.');
    return;
  }

  console.log(`Found ${jsonFiles.length} JSON file(s) in generated-ai/. Starting upload...`);

  let totalQuestions = 0;
  let totalOptions = 0;

  for (const f of jsonFiles) {
    const p = join(dir, f);
    console.log(`\nProcessing ${f} ...`);
    const { insertedQuestions, insertedOptions } = await processFile(p);
    console.log(`Inserted ${insertedQuestions} question(s) and ${insertedOptions} option(s) from ${f}`);
    totalQuestions += insertedQuestions;
    totalOptions += insertedOptions;
  }

  console.log(`\nDone. Inserted a total of ${totalQuestions} question(s) and ${totalOptions} option(s).`);
}

await main();


