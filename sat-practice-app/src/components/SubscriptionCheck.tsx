'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { checkSubscription } from '../utils/subscription';

interface SubscriptionCheckProps {
  children: ReactNode;
  redirectTo?: string; // Where to redirect if no subscription
}

export default function SubscriptionCheck({ 
  children, 
  redirectTo = '/pricing' 
}: SubscriptionCheckProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    const checkUserSubscription = async () => {
      try {
        const { hasActiveSubscription, planType } = await checkSubscription();
        console.log('Subscription check result:', { hasActiveSubscription, planType });
        
        if (!hasActiveSubscription) {
          console.log('No active subscription, redirecting to:', redirectTo);
          router.push(redirectTo);
        } else {
          console.log('Active subscription found, type:', planType);
          setHasSubscription(true);
          setIsChecking(false);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        // On error, redirect to pricing to be safe
        router.push(redirectTo);
      }
    };

    checkUserSubscription();
  }, [router, redirectTo]);

  // Show loading state while checking subscription
  if (isChecking) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <div style={styles.loadingText}>Loading...</div>
      </div>
    );
  }

  // Only render the children if the user has an active subscription
  return hasSubscription ? <>{children}</> : null;
}

const styles = {
  loadingContainer: {
    display: "flex" as const,
    flexDirection: "column" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    height: "100vh",
    backgroundColor: "#f9fafb",
    gap: "16px",
  },
  loadingSpinner: {
    border: "4px solid rgba(0, 0, 0, 0.1)",
    borderTop: "4px solid #4b5563",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    fontSize: "16px",
    color: "#4b5563",
    textAlign: "center" as const,
    padding: "0 16px",
  }
}

// Add the keyframes for the spinner animation
const globalStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

if (typeof document !== 'undefined') {
  // Only run in browser environment
  const style = document.createElement('style');
  style.innerHTML = globalStyles;
  document.head.appendChild(style);
} 