'use client'

import Link from "next/link";
import { GraduationCap } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    // Check if email is from approved domains for free access
    const approvedDomains = ['@bentonvillek12.org', '@knilok.com', '@inupup.com'];
    const isApprovedStudent = approvedDomains.some(domain => email.toLowerCase().endsWith(domain));

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
        // If signup was successful and user is from approved domain, create free subscription
        if (isApprovedStudent && data?.user?.id) {
          try {
            await createFreeSubscription(data.user.id, email);
            setSuccess('Sign up successful! You have been given free access to all features. Please check your email for a confirmation link. You must confirm your email before logging in.');
          } catch (subscriptionError) {
            console.error('Error creating free subscription:', subscriptionError);
            // Still show success for signup even if subscription creation fails
            setSuccess('Sign up successful! Please check your email for a confirmation link. You must confirm your email before logging in.');
          }
        } else {
          setSuccess('Sign up successful! Please check your email for a confirmation link. You must confirm your email before logging in.');
        }
        
        setEmail('');
        setPassword('');
        
        setTimeout(() => {
          router.push('/login?signup=success');
        }, 2000);
      }
    }
  };

  const createFreeSubscription = async (userId, userEmail) => {
    try {
      const response = await fetch('/api/create-free-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          userEmail: userEmail
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error creating free subscription:', result);
        throw new Error(result.error || 'Failed to create subscription');
      }

      console.log('Free subscription created successfully for approved domain user');
    } catch (error) {
      console.error('Error in createFreeSubscription:', error);
      throw error;
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
  };

  return (
    <div style={styles.container}>
      <div style={styles.logoContainer}>
        <img src="/assets/images/logo.png" alt="Brill Logo" style={{ height: '80px', width: 'auto' }} />
      </div>
      
      <div style={styles.card}>
        <h2 style={styles.heading}>Sign Up</h2>
        
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
 
        </div>
      </div>
    </div>
  );
} 