'use client'

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Handle tokens at the root URL
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      
      // If there's a token in the URL hash, redirect to reset-password
      if (hash && hash.includes('access_token')) {
        console.log('Root page - Access token found, redirecting to reset-password');
        window.location.href = `/reset-password${hash}`;
        return;
      }
      
      // Handle error conditions
      if (hash && hash.includes('error=')) {
        console.log('Root page - Error in hash, redirecting to forgot-password');
        const errorParams = new URLSearchParams(hash.substring(1));
        const errorMessage = errorParams.get('error_description') || 'Authentication error';
        window.location.href = `/forgot-password?error=${encodeURIComponent(errorMessage)}`;
        return;
      }
    }
  }, []);

  // This component is not rendered if we redirect
  // Otherwise it will be replaced by the static HTML from middleware
  return null;
}