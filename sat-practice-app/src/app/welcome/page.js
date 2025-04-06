'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Welcome() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for recovery token in hash
      const hash = window.location.hash;
      if (hash && hash.includes('type=recovery')) {
        console.log('Welcome page - Recovery token found, redirecting to reset-password');
        // Use immediate window.location for hard redirect that preserves the hash
        window.location.href = `/reset-password${hash}`;
        return;
      }
    }
  }, [router]);

  // This content will only be shown briefly before static HTML is loaded
  // or if there's no token in the URL
  return null;
} 