import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' }); // Load environment variables

const supabaseUrl = "";
const supabaseAnonKey = ""
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
