'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';

export default function ResetRedirect() {
  const router = useRouter();
  const [error, setError] = useState(null);

  useEffect(() => {
    // Function to handle the redirect
    const handleRedirect = async () => {
      if (typeof window !== 'undefined') {
        try {
          console.log('Reset Redirect - URL Hash:', window.location.hash);
          console.log('Reset Redirect - Full URL:', window.location.href);
          
          const hash = window.location.hash;
          if (hash && hash.includes('access_token') && hash.includes('type=recovery')) {
            console.log('Valid recovery token found, redirecting to reset-password');
            // Deliberately set a timeout to ensure the browser has time to process
            setTimeout(() => {
              // Use window.location for a hard redirect to preserve the hash
              window.location.href = `/reset-password${hash}`;
            }, 500);
          } else {
            console.log('No valid recovery token found, redirecting to forgot-password');
            setError('Invalid or missing recovery token. Please request a new password reset.');
            setTimeout(() => {
              router.push('/forgot-password');
            }, 2000);
          }
        } catch (err) {
          console.error('Reset redirect error:', err);
          setError('An error occurred. Redirecting to forgot password page.');
          setTimeout(() => {
            router.push('/forgot-password');
          }, 2000);
        }
      }
    };

    handleRedirect();
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
        <h2 style={{ marginBottom: '1rem' }}>Password Reset</h2>
        {error ? (
          <div style={{ 
            padding: '0.75rem', 
            backgroundColor: '#fef2f2',
            borderRadius: '4px',
            borderLeft: '4px solid #dc2626',
            marginBottom: '1rem'
          }}>
            {error}
          </div>
        ) : (
          <p>Please wait while we redirect you to reset your password...</p>
        )}
      </div>
    </div>
  );
} 