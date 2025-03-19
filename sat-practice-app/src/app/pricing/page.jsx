'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { getPaymentLink } from '../../../lib/payment';

export default function PricingPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking auth in pricing page');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Auth error in pricing page:', authError);
          setError('Authentication error. Please try again.');
        } else {
          console.log('User in pricing page:', user?.email || 'No user');
          setUser(user);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error checking auth in pricing page:', error);
        setError('An unexpected error occurred. Please try again.');
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleSubscribe = (planType) => {
    console.log('Handling subscription for plan:', planType);
    
    // If user is not logged in, redirect to signup
    if (!user) {
      console.log('User not logged in, redirecting to signup');
      // Store the plan type in localStorage to redirect back after signup
      localStorage.setItem('selectedPlan', planType);
      router.push('/signup');
      return;
    }

    // User is logged in, redirect to Stripe
    const paymentLink = getPaymentLink(planType);
    console.log('Redirecting to payment link:', paymentLink);
    window.location.href = paymentLink;
  };

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f9fafb',
    },
    logoContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '24px',
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
    content: {
      flex: 1,
      padding: '32px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    },
    heading: {
      fontSize: '32px',
      fontWeight: 600,
      textAlign: 'center',
      marginBottom: '16px',
      color: '#111827',
    },
    subheading: {
      fontSize: '18px',
      textAlign: 'center',
      marginBottom: '48px',
      color: '#4b5563',
      maxWidth: '600px',
    },
    plansContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      width: '100%',
      maxWidth: '1000px',
      margin: '0 auto',
    },
    planRow: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    },
    planCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      padding: '32px',
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      transition: 'transform 0.2s, box-shadow 0.2s',
    },
    planName: {
      fontSize: '24px',
      fontWeight: 600,
      marginBottom: '16px',
      color: '#111827',
    },
    priceContainer: {
      marginBottom: '24px',
    },
    price: {
      fontSize: '36px',
      fontWeight: 700,
      color: '#111827',
    },
    pricePeriod: {
      fontSize: '18px',
      color: '#6b7280',
      marginLeft: '4px',
    },
    planFeatures: {
      listStyle: 'none',
      padding: 0,
      margin: '0 0 24px 0',
    },
    planFeature: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '12px',
      fontSize: '16px',
      color: '#374151',
    },
    featureCheck: {
      width: '20px',
      height: '20px',
      color: '#10b981',
      marginRight: '12px',
    },
    ctaButton: {
      marginTop: 'auto',
      padding: '12px 0',
      textAlign: 'center',
      borderRadius: '8px',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    primaryButton: {
      backgroundColor: '#10b981',
      color: 'white',
      border: 'none',
    },
    secondaryButton: {
      backgroundColor: 'white',
      color: '#10b981',
      border: '2px solid #10b981',
    },
    bestValue: {
      display: 'inline-block',
      backgroundColor: '#10b981',
      color: 'white',
      fontSize: '14px',
      fontWeight: 600,
      padding: '4px 12px',
      borderRadius: '999px',
      marginBottom: '8px',
    },
    footer: {
      textAlign: 'center',
      padding: '24px',
      borderTop: '1px solid #e5e7eb',
      backgroundColor: 'white',
    },
    footerText: {
      fontSize: '14px',
      color: '#6b7280',
    },
    footerLink: {
      color: '#10b981',
      textDecoration: 'none',
    },
    errorMessage: {
      backgroundColor: '#fee2e2',
      color: '#b91c1c',
      padding: '12px',
      borderRadius: '8px',
      marginBottom: '24px',
      fontSize: '14px',
    },
  };

  // Apply media query for responsive layout using inline styles
  useEffect(() => {
    const handleResize = () => {
      const planRowEl = document.getElementById('plan-row');
      if (planRowEl) {
        if (window.innerWidth >= 768) {
          planRowEl.style.flexDirection = 'row';
        } else {
          planRowEl.style.flexDirection = 'column';
        }
      }
    };

    handleResize(); // Initial call
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.logoContainer}>
          <GraduationCap style={styles.logo} />
          <h1 style={styles.title}>SATPrepPro</h1>
        </div>
        <div style={styles.content}>
          <h2 style={styles.heading}>Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.logoContainer}>
        <GraduationCap style={styles.logo} />
        <h1 style={styles.title}>SATPrepPro</h1>
      </div>

      <div style={styles.content}>
        <h2 style={styles.heading}>Choose Your SAT Prep Plan</h2>
        <p style={styles.subheading}>
          Full access to all features with either plan. Choose what works for your preparation timeline.
        </p>

        {error && <div style={styles.errorMessage}>{error}</div>}

        <div style={styles.plansContainer}>
          <div id="plan-row" style={styles.planRow}>
            {/* Monthly Plan Card */}
            <div 
              style={styles.planCard}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            >
              <h3 style={styles.planName}>Monthly Plan</h3>
              <div style={styles.priceContainer}>
                <span style={styles.price}>$29</span>
                <span style={styles.pricePeriod}>/month</span>
                <p style={{ color: '#6b7280', marginTop: '4px', fontSize: '14px' }}>
                  Cancel anytime
                </p>
              </div>

              <ul style={styles.planFeatures}>
                <li style={styles.planFeature}>
                  <svg style={styles.featureCheck} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  2,000+ SAT practice questions
                </li>
                <li style={styles.planFeature}>
                  <svg style={styles.featureCheck} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  15+ full-length practice exams
                </li>
                <li style={styles.planFeature}>
                  <svg style={styles.featureCheck} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  AI tutor with hints and explanations
                </li>
                <li style={styles.planFeature}>
                  <svg style={styles.featureCheck} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Performance analytics dashboard
                </li>
              </ul>

              <button 
                style={{ ...styles.ctaButton, ...styles.secondaryButton }}
                onClick={() => handleSubscribe('monthly')}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f0fdfa';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Start Monthly Plan
              </button>
            </div>

            {/* 6-Month Plan Card */}
            <div 
              style={styles.planCard}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            >
              <span style={styles.bestValue}>BEST VALUE</span>
              <h3 style={styles.planName}>6-Month Plan</h3>
              <div style={styles.priceContainer}>
                <span style={styles.price}>$25</span>
                <span style={styles.pricePeriod}>/month</span>
                <p style={{ color: '#6b7280', marginTop: '4px', fontSize: '14px' }}>
                  $150 billed once (Save 14%)
                </p>
              </div>

              <ul style={styles.planFeatures}>
                <li style={styles.planFeature}>
                  <svg style={styles.featureCheck} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  2,000+ SAT practice questions
                </li>
                <li style={styles.planFeature}>
                  <svg style={styles.featureCheck} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  15+ full-length practice exams
                </li>
                <li style={styles.planFeature}>
                  <svg style={styles.featureCheck} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  AI tutor with hints and explanations
                </li>
                <li style={styles.planFeature}>
                  <svg style={styles.featureCheck} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Performance analytics dashboard
                </li>
              </ul>

              <button 
                style={{ ...styles.ctaButton, ...styles.primaryButton }}
                onClick={() => handleSubscribe('six_month')}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#0d9488';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#10b981';
                }}
              >
                Save With 6-Month Plan
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        <p style={styles.footerText}>
          {user ? (
            <span>Want to go back? <Link href="/home" style={styles.footerLink}>Return to Dashboard</Link></span>
          ) : (
            <span>Already have an account? <Link href="/login" style={styles.footerLink}>Log in</Link></span>
          )}
        </p>
      </div>
    </div>
  );
} 