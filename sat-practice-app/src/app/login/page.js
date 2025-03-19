"use client"

import Link from "next/link"
import { GraduationCap } from 'lucide-react'
import { useState, useEffect, Suspense } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';

// Create a content component for login functionality
function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Check if coming from successful signup
    const fromSignup = searchParams.get('signup');
    if (fromSignup === 'success') {
      setSignupSuccess(true);
    }
    
    // Log auth state for debugging
    const checkAuth = async () => {
      console.log('Checking auth state on login page load');
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error getting user on login page:', error.message);
        } else if (user) {
          console.log('User already logged in on login page:', user.email);
        } else {
          console.log('No user authenticated on login page');
        }
      } catch (error) {
        console.error('Unexpected error checking auth on login page:', error);
      }
    };
    
    checkAuth();
  }, [searchParams, supabase.auth]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError('Email and password are required.');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting login for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error.message);
        if (error.message.includes('email') && error.message.includes('confirm')) {
          setError('Email not confirmed. Please check your inbox and confirm your email before logging in.');
        } else {
          setError(error.message);
        }
        setLoading(false);
        return;
      }

      if (data?.session) {
        console.log('Login successful, session created');
        
        // Check if we need to redirect to pricing page
        const redirectToPricing = typeof window !== 'undefined' ? localStorage.getItem('redirectToPricing') : null;
        const selectedPlan = typeof window !== 'undefined' ? localStorage.getItem('selectedPlan') : null;
        
        if (redirectToPricing || selectedPlan) {
          // Clear the flags from localStorage
          console.log('Redirecting to pricing page after login');
          localStorage.removeItem('redirectToPricing');
          // Keep selectedPlan for the pricing page to use
          router.push('/pricing');
        } else {
          console.log('Redirecting to home page after login');
          router.push('/home');
        }
      } else {
        console.error('Login failed - no session created');
        setError('Login failed - no session created');
        setLoading(false);
      }
    } catch (error) {
      console.error('Unexpected login error:', error);
      setError('An error occurred during login.');
      setLoading(false);
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
      marginBottom: '32px',
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
    buttonDisabled: {
      backgroundColor: '#9ca3af',
      cursor: 'not-allowed',
    },
    links: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '16px',
    },
    link: {
      color: '#10b981',
      textDecoration: 'none',
      fontSize: '14px',
      transition: 'color 0.3s ease',
    },
    message: {
      marginTop: '16px',
      fontSize: '14px',
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
    successMessage: {
      marginTop: '16px',
      fontSize: '14px',
      backgroundColor: '#ecfdf5',
      padding: '12px',
      borderRadius: '4px',
      borderLeft: '4px solid #10b981',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.logoContainer}>
        <GraduationCap style={styles.logo} />
        <h1 style={styles.title}>SATPrepPro</h1>
      </div>
      
      <div style={styles.card}>
        <h2 style={styles.heading}>Login</h2>
        
        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="username" style={styles.label}>Email</label>
            <input 
              id="username"
              type="email" 
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <input 
              id="password"
              type="password"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }}
            disabled={loading}
            onMouseOver={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#0d9488';
            }}
            onMouseOut={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = '#10b981';
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        {signupSuccess && (
          <div style={styles.successMessage}>
            Sign up successful! Please check your email for a confirmation link. You must confirm your email before logging in.
          </div>
        )}
        
        {error && <div style={styles.errorMessage}>{error}</div>}
        
        <div style={styles.links}>
          <Link 
            href="/signup" 
            style={styles.link}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#0d9488';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = '#10b981';
            }}
          >
            Register
          </Link>
          <Link 
            href="/forgot-password" 
            style={styles.link}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#0d9488';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = '#10b981';
            }}
          >
            Forgot Password?
          </Link>
        </div>
      </div>
    </div>
  )
}

// Main component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Loading...
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please wait while we prepare the login page
            </p>
          </div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}