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
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        // On error, redirect to pricing to be safe
        router.push(redirectTo);
      } finally {
        setIsChecking(false);
      }
    };

    checkUserSubscription();
  }, [router, redirectTo]);

  // Show loading state while checking subscription
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-700">Verifying subscription...</p>
        </div>
      </div>
    );
  }

  // Only render the children if the user has an active subscription
  return hasSubscription ? <>{children}</> : null;
} 