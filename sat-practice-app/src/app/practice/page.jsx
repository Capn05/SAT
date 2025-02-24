'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Question from '../components/Question';
import TopBar from '../components/TopBar';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function PracticePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mode = searchParams.get('mode');
  const subject = searchParams.get('subject');
  const category = searchParams.get('category');

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        if (!mounted) return;
        
        setLoading(true);
        setError(null);

        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }

        if (!session) {
          console.log('No session found, redirecting to login');
          router.push('/login');
          return;
        }

        // Set up real-time auth state listener
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          if (!session && mounted) {
            router.push('/login');
          }
        });

        // Validate required parameters
        if (!mode || !subject) {
          setError('Missing required parameters');
          return;
        }

        // Validate mode-specific parameters
        if (mode === 'skill' && !category) {
          setError('Missing category for skill practice');
          return;
        }

        setLoading(false);

        // Cleanup subscription
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Auth error:', error);
        if (mounted) {
          setError(error.message);
          router.push('/login');
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [mode, subject, category, router, supabase.auth]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading practice session...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorText}>Error: {error}</div>
        <button 
          style={styles.returnButton}
          onClick={() => router.push('/home')}
        >
          Return to Home
        </button>
      </div>
    );
  }

  const title = mode === 'skill' 
    ? `Practice: ${category}`
    : 'Quick Practice';

  return (
    <div style={styles.container}>
      <TopBar title={title} />
      <Question 
        mode={mode}
        subject={subject}
        skillName={category}
      />
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    fontSize: '18px',
    color: '#4b5563',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    gap: '20px',
  },
  errorText: {
    fontSize: '18px',
    color: '#dc2626',
  },
  returnButton: {
    padding: '8px 16px',
    backgroundColor: '#65a30d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
}; 