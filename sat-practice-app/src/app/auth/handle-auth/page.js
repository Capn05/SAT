'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';

export default function HandleAuth() {
  const router = useRouter();
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('Handle Auth - URL Hash:', window.location.hash);
      console.log('Handle Auth - Search Params:', window.location.search);
      console.log('Handle Auth - Full URL:', window.location.href);
      
      // Parse URL for tokens or errors
      const hash = window.location.hash;
      const searchParams = new URLSearchParams(window.location.search);
      
      // First check for errors
      if (searchParams.get('error') || (hash && hash.includes('error='))) {
        console.log('Error found in URL, redirecting to forgot-password');
        const errorMessage = searchParams.get('error_description') || 
                            (hash && new URLSearchParams(hash.substring(1)).get('error_description'));
        
        // Show error for a moment, then redirect
        setError(errorMessage ? decodeURIComponent(errorMessage) : 'Authentication error');
        setTimeout(() => {
          router.push('/forgot-password?error=' + encodeURIComponent(errorMessage || 'Authentication error'));
        }, 1500);
        return;
      }
      
      // Handle recovery token in hash
      if (hash && hash.includes('type=recovery')) {
        console.log('Recovery token found in hash, redirecting to reset-password');
        // Use window.location for true redirect that preserves hash
        window.location.href = `/reset-password${hash}`;
        return;
      }
      
      // Handle recovery token in query params
      if (searchParams.get('type') === 'recovery') {
        console.log('Recovery token found in query, redirecting to reset-password');
        // Reconstruct the hash from query parameters for Supabase to process
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const expiresIn = searchParams.get('expires_in');
        const expiresAt = searchParams.get('expires_at');
        const tokenType = searchParams.get('token_type');
        
        if (accessToken) {
          const constructedHash = `#access_token=${accessToken}` + 
            (refreshToken ? `&refresh_token=${refreshToken}` : '') +
            (expiresIn ? `&expires_in=${expiresIn}` : '') +
            (expiresAt ? `&expires_at=${expiresAt}` : '') +
            (tokenType ? `&token_type=${tokenType}` : '') +
            '&type=recovery';
            
          window.location.href = `/reset-password${constructedHash}`;
          return;
        }
      }
      
      // Fallback - if no tokens or unhandled auth type, redirect to login
      router.push('/login');
    }
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      backgroundColor: '#f9fafb'
    }}>
      <div style={{
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>
          {error ? 'Authentication Error' : 'Processing...'}
        </h2>
        {error ? (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#fef2f2',
            borderRadius: '4px',
            borderLeft: '4px solid #dc2626',
            marginBottom: '1rem',
            textAlign: 'left'
          }}>
            {error}
          </div>
        ) : (
          <p>Please wait while we redirect you to the appropriate page.</p>
        )}
      </div>
    </div>
  );
} 