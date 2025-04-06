'use client'

import Link from "next/link";
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email) {
      setError('Email is required.');
      return;
    }

    try {
      // Get the base URL for redirects
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

      // Call the password reset function with the reset-redirect path that will handle the token properly
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${baseUrl}/auth/reset-redirect`,
      });

      if (error) {
        console.error('Reset password error:', error);
        setError(error.message);
      } else {
        setSuccess('Password reset instructions have been sent to your email.');
        setEmail('');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError('An error occurred. Please try again.');
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
      justifyContent: 'center',
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
        <h2 style={styles.heading}>Reset Password</h2>
        
        <form onSubmit={handleResetPassword} style={styles.form}>
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
            Send Reset Instructions
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
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
} 