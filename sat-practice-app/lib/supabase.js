import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // This enables detecting tokens in the URL for password reset
    // Add retry configuration for auth requests
    retryAttempts: 2,
    retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 5000), // Max 5s delay
  },
  global: {
    // Add rate limit handling for auth requests
    headers: { 'X-Client-Info': 'supabase-js-v2' },
    // Add exponential backoff to prevent hitting rate limits
    fetch: (url, options) => {
      const maxRetries = 2; // Reduced from 3 to prevent too many requests
      const minTimeout = 2000; // Increased minimum timeout to 2s
      
      return new Promise((resolve, reject) => {
        const makeRequest = (retries) => {
          fetch(url, options)
            .then(response => {
              // If we hit a rate limit and have retries left, wait and try again
              if (response.status === 429 && retries > 0) {
                // Exponential backoff with jitter
                const timeout = minTimeout * Math.pow(2, maxRetries - retries) 
                  + (Math.random() * 2000); // Increased jitter
                console.warn(`Rate limited, retrying in ${Math.round(timeout)}ms`, 
                  { retries, url: url.toString() });
                  
                setTimeout(() => makeRequest(retries - 1), timeout);
              } else if (response.status === 400 && retries === maxRetries) {
                // On first 400 error (like invalid refresh token), don't retry immediately
                console.warn('Auth request returned 400, likely invalid token');
                resolve(response);
              } else {
                resolve(response);
              }
            })
            .catch(error => {
              if (retries > 0) {
                const timeout = minTimeout * Math.pow(2, maxRetries - retries) 
                  + (Math.random() * 2000);
                console.warn(`Auth request failed, retrying in ${Math.round(timeout)}ms`, { retries, error: error.message });
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
