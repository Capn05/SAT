import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // This enables detecting tokens in the URL for password reset
  },
  global: {
    // Add rate limit handling for auth requests
    headers: { 'X-Client-Info': 'supabase-js-v2' },
    // Add exponential backoff to prevent hitting rate limits
    fetch: (url, options) => {
      const maxRetries = 3;
      const minTimeout = 1000; // Start with a 1s timeout
      
      return new Promise((resolve, reject) => {
        const makeRequest = (retries) => {
          fetch(url, options)
            .then(response => {
              // If we hit a rate limit and have retries left, wait and try again
              if (response.status === 429 && retries > 0) {
                // Exponential backoff with jitter
                const timeout = minTimeout * Math.pow(2, maxRetries - retries) 
                  + (Math.random() * 1000);
                console.warn(`Rate limited, retrying in ${timeout}ms`, 
                  { retries, url: url.toString() });
                  
                setTimeout(() => makeRequest(retries - 1), timeout);
              } else {
                resolve(response);
              }
            })
            .catch(error => {
              if (retries > 0) {
                const timeout = minTimeout * Math.pow(2, maxRetries - retries) 
                  + (Math.random() * 1000);
                console.warn(`Auth request failed, retrying in ${timeout}ms`, { retries, error });
                setTimeout(() => makeRequest(retries - 1), timeout);
              } else {
                reject(error);
              }
            });
        };
        
        makeRequest(maxRetries);
      });
    }
  }
});
