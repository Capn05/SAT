'use client'

import Link from "next/link";
import { GraduationCap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    // Check if a plan was selected before redirecting to signup
    const storedPlan = typeof window !== 'undefined' ? localStorage.getItem('selectedPlan') : null;
    if (storedPlan) {
      setSelectedPlan(storedPlan);
    }
  }, []);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      if (
        error.message.includes('email already registered') ||
        error.message.includes('already been registered') ||
        error.message.includes('already exists')
      ) {
        setError('This email is already registered. Please log in or use a different email.');
      } else {
        setError(error.message);
      }
      setSuccess(null);
    } else {
      if (data?.user?.identities?.length === 0) {
        setError('This email is already registered. Please log in or use a different email.');
      } else {
        setSuccess('Sign up successful! Please check your email for a confirmation link. You must confirm your email before logging in.');
        setEmail('');
        setPassword('');
        
        // Store the selected plan in localStorage for after login if it exists
        if (selectedPlan) {
          localStorage.setItem('redirectToPricing', 'true');
        }
        
        setTimeout(() => {
          router.push('/login?signup=success');
        }, 2000);
      }
    }
  };

  const handleGoogleSignUp = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });

    if (error) {
      setError(error.message);
      setSuccess(null);
    } else {
      setSuccess('Google sign-up initiated!');
      setEmail('');
      setPassword('');
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
    buttonHover: {
      backgroundColor: '#0d9488',
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
    planInfo: {
      marginTop: '16px',
      marginBottom: '16px',
      backgroundColor: '#10b981',
      color: 'white',
      padding: '12px',
      borderRadius: '4px',
      textAlign: 'center',
      fontSize: '14px',
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.logoContainer}>
        <GraduationCap style={styles.logo} />
        <h1 style={styles.title}>SATPrepPro</h1>
      </div>
      
      <div style={styles.card}>
        <h2 style={styles.heading}>Sign Up</h2>
        
        {selectedPlan && (
          <div style={styles.planInfo}>
            You're signing up for the {selectedPlan === 'monthly' ? 'Monthly' : '6-Month'} Plan
          </div>
        )}
        
        <form onSubmit={handleSignUp} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>Email</label>
            <input 
              id="email"
              type="email" 
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
            Sign Up
          </button>
        </form>
        
        {error && <div style={styles.errorMessage}>{error}</div>}
        {success && <div style={styles.successMessage}>{success}</div>}
        
        <div style={styles.links}>
          <Link 
            href="/login" 
            style={styles.link}
            onMouseOver={(e) => {
              e.currentTarget.style.color = '#0d9488';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = '#10b981';
            }}
          >
            Login
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
  );
} 