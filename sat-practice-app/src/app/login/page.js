'use client'
import Link from "next/link"
import { GraduationCap } from 'lucide-react'
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    const { user, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setSuccess(null);
    } else {
      setSuccess('Login successful!');
      setEmail('');
      setPassword('');
      router.push('/home');
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });

    if (error) {
      setError(error.message);
      setSuccess(null);
    } else {
      setSuccess('Google login initiated!');
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
      color: '#65a30d',
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
      backgroundColor: '#65a30d',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      marginTop: '8px',
    },
    links: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '16px',
    },
    link: {
      color: '#65a30d',
      textDecoration: 'none',
      fontSize: '14px',
    },
    message: {
      marginTop: '16px',
      fontSize: '14px',
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
            <label htmlFor="username" style={styles.label}>Username</label>
            <input 
              id="username"
              type="text" 
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
          >
            Login
          </button>
        </form>
        
        {error && <p style={{ color: 'red', ...styles.message }}>{error}</p>}
        {success && <p style={{ color: 'green', ...styles.message }}>{success}</p>}
        
        <div style={styles.links}>
          <Link 
            href="/signup" 
            style={styles.link}
          >
            Register
          </Link>
          <Link 
            href="/forgot-password" 
            style={styles.link}
          >
            Forgot Password?
          </Link>
        </div>
      </div>
    </div>
  )
}