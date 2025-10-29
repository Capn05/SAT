import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local in the project root
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Prefer service role if available for unrestricted reads
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

const OUTPUT_DIR = join(__dirname, '../generated-exports');

function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/__+/g, '_');
}

async function fetchSubcategoryName(subcategoryId) {
  try {
    const { data, error } = await supabase
      .from('subcategories')
      .select('subcategory_name')
      .eq('id', subcategoryId)
      .maybeSingle();
    if (error) return null;
    return data?.subcategory_name || null;
  } catch {
    return null;
  }
}

async function fetchQuestions(subcategoryId, difficulty) {
  // Query directly like the API route does
  const { data, error } = await supabase
    .from('questions')
    .select(`
      id,
      subject_id,
      domain_id,
      subcategory_id,
      difficulty,
      question_text,
      image_url,
      options(
        id,
        label,
        value,
        is_correct
      )
    `)
    .eq('subcategory_id', subcategoryId)
    .eq('difficulty', difficulty)
    .order('id');

  if (error) throw error;
  return (data || []).map(q => ({
    id: q.id,
    subject_id: q.subject_id,
    domain_id: q.domain_id,
    subcategory_id: q.subcategory_id,
    difficulty: q.difficulty,
    question_text: q.question_text,
    image_url: q.image_url,
    options: (q.options || [])
      .slice()
      .sort((a, b) => String(a.value).localeCompare(String(b.value)))
      .map(op => ({ id: op.id, label: op.label, value: op.value, is_correct: op.is_correct }))
  }));
}

async function fetchAllSubcategories() {
  const { data, error } = await supabase
    .from('subcategories')
    .select('id, subcategory_name')
    .order('id');
  if (error) throw error;
  return data || [];
}

async function main() {
  try {
    mkdirSync(OUTPUT_DIR, { recursive: true });

    const difficulties = ['Easy', 'Medium', 'Hard'];
    let subcategories = [];
    try {
      subcategories = await fetchAllSubcategories();
    } catch (e) {
      console.warn('Failed to fetch subcategories list. Falling back to id range 1..29. Reason:', e?.message || e);
      subcategories = Array.from({ length: 29 }, (_, i) => ({ id: i + 1, subcategory_name: null }));
    }

    console.log(`Exporting questions for ${subcategories.length} subcategories × ${difficulties.length} difficulties...`);

    for (const sub of subcategories) {
      const subId = sub.id;
      const resolvedName = sub.subcategory_name || await fetchSubcategoryName(subId);
      const subSlug = slugify(resolvedName || `subcategory_${subId}`);
      for (const diff of difficulties) {
        const questions = await fetchQuestions(subId, diff);
        const fileName = `${subSlug}_${diff}.json`;
        const filePath = join(OUTPUT_DIR, fileName);
        writeFileSync(filePath, JSON.stringify(questions, null, 2));
        console.log(`Wrote ${questions.length.toString().padStart(3, ' ')} q → ${fileName}`);
      }
    }

    console.log('Done. Files written to:', OUTPUT_DIR);
  } catch (err) {
    console.error('Export failed:', err);
    process.exit(1);
  }
}

await main();


