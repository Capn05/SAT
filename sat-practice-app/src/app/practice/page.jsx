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
  const [questions, setQuestions] = useState([]);

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

        // Special handling for test mode
        if (mode === 'test') {
          console.log('Fetching test question...');
          const { data: testQuestions, error: fetchError } = await supabase
            .from('questions')
            .select(`
              *,
              options (*)
            `)
            .eq('subject_id', 1) // Math questions
            .eq('subcategory_id', 1) // Equivalent Expressions
            .order('id', { ascending: false })
            .limit(1);

          if (fetchError) {
            console.error('Error fetching test question:', fetchError);
            setError('Error fetching test question');
            return;
          }

          if (!testQuestions || testQuestions.length === 0) {
            console.error('No test questions found');
            setError('No test questions found');
            return;
          }

          console.log('Found test question:', testQuestions[0]);
          setQuestions(testQuestions);
          setLoading(false);
          return;
        }

        // Validate required parameters for non-test modes
        if (!mode || !subject) {
          setError('Missing required parameters');
          return;
        }

        // Fetch questions based on mode
        let questionsData;
        if (mode === 'quick') {
          const response = await fetch(`/api/quick-practice?subject=${subject}`);
          if (!response.ok) {
            throw new Error('Failed to fetch quick practice questions');
          }
          const data = await response.json();
          questionsData = data.questions;
        } else if (mode === 'skill' && category) {
          const response = await fetch(`/api/skill-questions?subject=${subject}&category=${encodeURIComponent(category)}`);
          if (!response.ok) {
            throw new Error('Failed to fetch skill questions');
          }
          const data = await response.json();
          questionsData = data.questions;
        } else {
          throw new Error('Invalid mode or missing category for skill practice');
        }

        if (!questionsData || questionsData.length === 0) {
          setError('No questions available');
          return;
        }

        setQuestions(questionsData);
        setLoading(false);

        // Cleanup subscription
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error in checkAuth:', error);
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
        <div style={styles.loadingText}>Loading questions...</div>
        <div style={styles.loadingDetails}>
          Mode: {mode}, Subject: {subject || 'N/A'}, Skill: {category || 'N/A'}
        </div>
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

  // Add debug logging
  console.log('Rendering with questions:', questions);

  const title = mode === 'skill' 
    ? `Practice: ${category}`
    : mode === 'test'
    ? 'Test Question'
    : 'Quick Practice';

  return (
    <div style={styles.container}>
      <TopBar title={title} />
      {questions.length > 0 && (
        <Question 
          mode={mode}
          subject={subject || '1'}  // Default to Math (1) for test mode
          skillName={category}
          questions={questions}  // Make sure we're passing the questions prop
        />
      )}
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
  loadingDetails: {
    fontSize: '14px',
    color: '#6b7280',
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