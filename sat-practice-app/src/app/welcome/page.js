'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Welcome() {
  const router = useRouter();

  useEffect(() => {
    // Safety check for hash tokens that might slip through middleware
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);
      
      // Handle error in hash
      if (hash && hash.includes('error=')) {
        console.log('Welcome page - Error found in hash, redirecting to forgot-password');
        const errorParams = new URLSearchParams(hash.substring(1));
        const errorMessage = errorParams.get('error_description') || 'Authentication error';
        window.location.href = `/forgot-password?error=${encodeURIComponent(errorMessage)}`;
        return;
      }
      
      // Handle recovery token in hash
      if (hash && hash.includes('type=recovery')) {
        console.log('Welcome page - Recovery token found, redirecting to reset-password');
        window.location.href = `/reset-password${hash}`;
        return;
      }
      
      // Handle error in query params
      if (params.get('error')) {
        console.log('Welcome page - Error found in params, redirecting to forgot-password');
        const errorMessage = params.get('error_description') || 'Authentication error';
        window.location.href = `/forgot-password?error=${encodeURIComponent(errorMessage)}`;
        return;
      }
    }
  }, [router]);

  // This is a dummy component that won't normally be rendered
  // because the middleware will intercept the request
  // and serve the static HTML file directly
  return null;
} 