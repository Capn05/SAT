'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

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

    // Check if we have a recovery token in the URL hash
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash && hash.includes('type=recovery')) {
        console.log('Recovery token found on homepage, redirecting to reset-password page');
        // Use window.location to preserve the hash fragment
        window.location.href = `/reset-password${hash}`;
        return;
      }
    }
  }, [router]);

  // This component is not rendered if we redirect
  // Otherwise it will be replaced by the static HTML from middleware
  return null;
}