#!/usr/bin/env node

/**
 * Clear Auth State Script
 * 
 * This script helps clear corrupted authentication state that might be causing
 * infinite refresh loops and 429/400 errors.
 * 
 * Run this script if you're experiencing:
 * - Infinite 429 (rate limit) errors on startup
 * - 400 (refresh_token_not_found) errors
 * - Authentication loops
 * 
 * Usage: node clear-auth-state.js
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Clearing authentication state...');

// Clear Next.js cache
const nextCacheDir = path.join(__dirname, '.next');
if (fs.existsSync(nextCacheDir)) {
  console.log('📁 Clearing .next cache directory...');
  fs.rmSync(nextCacheDir, { recursive: true, force: true });
  console.log('✅ .next cache cleared');
} else {
  console.log('ℹ️  No .next cache directory found');
}

// Instructions for browser storage
console.log(`
🌐 Browser Storage Cleanup Instructions:

To complete the auth state cleanup, please do the following in your browser:

1. Open your browser's Developer Tools (F12)
2. Go to the Application/Storage tab
3. Clear the following:
   
   📝 Local Storage:
   - Delete all keys starting with "supabase"
   - Delete "sb-" prefixed keys
   
   🍪 Cookies:
   - Delete "sb-access-token"
   - Delete "sb-refresh-token"
   - Delete any other Supabase-related cookies
   
   💾 Session Storage:
   - Clear all Supabase-related items

OR simply:
4. Right-click on your site in the browser
5. Choose "Inspect" → "Application" → "Storage"
6. Click "Clear storage" → "Clear site data"

After clearing the storage, restart your dev server with:
npm run dev

This should resolve the 429/400 authentication errors.
`);

console.log('✅ Auth state cleanup script completed!');
console.log('🚀 Now clear your browser storage and restart the dev server.');
