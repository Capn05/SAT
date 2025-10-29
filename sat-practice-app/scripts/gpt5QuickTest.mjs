import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPEN_AI_API_KEY;
if (!apiKey) {
  console.error('Missing OPENAI_API_KEY in .env.local');
  process.exit(1);
}

const client = new OpenAI({ apiKey });

const response = await client.responses.create({
  model: 'gpt-5',
  input: 'Write a one-sentence bedtime story about a unicorn.'
});

console.log(response.output_text);


