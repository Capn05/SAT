import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkQuestion() {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select(`
        *,
        options (*)
      `)
      .eq('subject_id', 1)
      .eq('subcategory_id', 1);

    if (error) {
      console.error('Error fetching questions:', error);
      return;
    }

    console.log('Questions found:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

checkQuestion(); 