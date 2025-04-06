'use client'

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Log URL info for debugging
    if (typeof window !== 'undefined') {
      console.log('Reset Password - URL Hash:', window.location.hash);
      console.log('Reset Password - URL Search:', window.location.search);
      console.log('Reset Password - Full URL:', window.location.href);
      
      // Check for errors in the URL hash or query params
      const hash = window.location.hash;
      const searchParams = new URLSearchParams(window.location.search);
      
      if (hash && hash.includes('error=')) {
        console.log('Error detected in hash, redirecting to forgot-password');
        const errorParams = new URLSearchParams(hash.substring(1));
        const errorMessage = errorParams.get('error_description') || 'Authentication error';
        window.location.href = `/forgot-password?error=${encodeURIComponent(errorMessage)}`;
        return;
      }
      
      if (searchParams.get('error')) {
        console.log('Error detected in search params, redirecting to forgot-password');
        const errorMessage = searchParams.get('error_description') || 'Authentication error';
        window.location.href = `/forgot-password?error=${encodeURIComponent(errorMessage)}`;
        return;
      }
      
      // Check for access token in hash fragment (for password reset flow)
      if (hash && hash.includes('access_token') && hash.includes('type=recovery')) {
        console.log('Access token found, attempting to set session');
        
        // Extract the access token and use it to set the session
        try {
          // Let Supabase auth library handle the token parsing from the URL
          // This should trigger the onAuthStateChange listener
          supabase.auth.getSession()
            .then(({ data, error }) => {
              if (error) {
                console.error('Session error:', error);
                setHasSession(false);
              } else if (data && data.session) {
                console.log('Successfully set session from access token');
                setHasSession(true);
              } else {
                console.log('No session found despite access token');
                setHasSession(false);
              }
              setLoading(false);
            });
        } catch (error) {
          console.error('Error setting session from hash:', error);
          setHasSession(false);
          setLoading(false);
        }
      } else {
        // No hash with access token, proceed with normal session check
        checkSession();
      }
    } else {
      // Server-side rendering, set loading false
      setLoading(false);
    }
    
    // Listen for auth state changes
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, !!session);
      setHasSession(!!session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check if we have a valid session
  const checkSession = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.getSession();
      console.log('Session data:', data);
      if (error) {
        console.error('Session error:', error);
        setHasSession(false);
      } else if (data && data.session) {
        setHasSession(true);
      } else {
        setHasSession(false);
      }
    } catch (err) {
      console.error('Error checking session:', err);
      setHasSession(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!hasSession) {
      setError('No active session found. Please use the reset link from your email again.');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Both password fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        console.error('Update error:', updateError);
        setError(updateError.message);
      } else {
        setSuccess('Password has been updated successfully!');
        setTimeout(() => {
          router.push('/login?reset=success');
        }, 2000);
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError('An error occurred while resetting your password. Please try again.');
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '15px',
    },
    logo: {
      width: '32px',
      height: '32px',
      color: '#10b981',
    },
    title: {
      fontSize: '24px',
      fontWeight: 600,
      margin: 0,
    },
    card: {
      width: '100%',
      maxWidth: '400px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      padding: '32px',
    },
    heading: {
      fontSize: '24px',
      fontWeight: 500,
      textAlign: 'center',
      marginBottom: '24px',
      margin: 0,
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    label: {
      fontSize: '14px',
      fontWeight: 500,
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      fontSize: '14px',
      borderRadius: '4px',
      border: '1px solid #e5e7eb',
      backgroundColor: '#fcfcf7',
      boxSizing: 'border-box',
    },
    button: {
      width: '100%',
      padding: '10px',
      backgroundColor: '#10b981',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      marginTop: '8px',
      transition: 'background-color 0.3s ease',
    },
    buttonHover: {
      backgroundColor: '#0d9488',
    },
    message: {
      marginTop: '16px',
      fontSize: '14px',
    },
    successMessage: {
      marginTop: '16px',
      fontSize: '14px',
      backgroundColor: '#ecfdf5',
      padding: '12px',
      borderRadius: '4px',
      borderLeft: '4px solid #10b981',
    },
    errorMessage: {
      marginTop: '16px',
      fontSize: '14px',
      backgroundColor: '#fef2f2',
      padding: '12px',
      borderRadius: '4px',
      borderLeft: '4px solid #dc2626',
      color: '#b91c1c',
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.heading}>Set New Password</h2>
          <p style={{textAlign: 'center'}}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div style={styles.container}>
        <div style={styles.logoContainer}>
          <img src="/assets/images/logo.png" alt="Brill Logo" style={{ height: '80px', width: 'auto' }} />
        </div>
        
        <div style={styles.card}>
          <h2 style={styles.heading}>Password Reset Error</h2>
          <div style={styles.errorMessage}>
            Your password reset link is invalid or has expired. Please request a new password reset link.
          </div>
          <div style={{textAlign: 'center', marginTop: '20px'}}>
            <a 
              href="/forgot-password" 
              style={{
                ...styles.link,
                color: '#10b981',
                textDecoration: 'none',
                fontSize: '14px',
              }}
            >
              Request a new password reset
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.logoContainer}>
        <img src="/assets/images/logo.png" alt="Brill Logo" style={{ height: '80px', width: 'auto' }} />
      </div>
      
      <div style={styles.card}>
        <h2 style={styles.heading}>Set New Password</h2>
        
        <form onSubmit={handleResetPassword} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>New Password</label>
            <input 
              id="password"
              type="password"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label htmlFor="confirmPassword" style={styles.label}>Confirm New Password</label>
            <input 
              id="confirmPassword"
              type="password"
              style={styles.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            style={styles.button}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#0d9488';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#10b981';
            }}
          >
            Update Password
          </button>
        </form>
        
        {error && <div style={styles.errorMessage}>{error}</div>}
        {success && <div style={styles.successMessage}>{success}</div>}
      </div>
    </div>
  );
} 