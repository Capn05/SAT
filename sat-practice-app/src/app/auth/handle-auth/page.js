'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HandleAuth() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('Handle Auth - URL Hash:', window.location.hash);
      console.log('Handle Auth - Search Params:', window.location.search);
      console.log('Handle Auth - Full URL:', window.location.href);
      
      // Check for tokens in the URL (hash or query param)
      const hash = window.location.hash;
      const searchParams = new URLSearchParams(window.location.search);
      
      // Handle recovery token in hash (from password reset email)
      if (hash && hash.includes('type=recovery')) {
        console.log('Recovery token found in hash, redirecting to reset-password');
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
      
      // Fallback - if no tokens or unhandled auth type, redirect to home
      router.push('/home');
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
        <h2 style={{ marginBottom: '1rem' }}>Processing...</h2>
        <p>Please wait while we redirect you to the appropriate page.</p>
      </div>
    </div>
  );
} 