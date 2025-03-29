import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useState, useEffect } from 'react';

type PlanType = 'monthly' | 'quarterly';

interface StripePaymentProps {
  id?: string;
  planType: PlanType;
  buttonText: string;
  className?: string;
}

// Payment links should be stored in environment variables, but for testing we'll hardcode them
const PAYMENT_LINKS = {
  monthly: process.env.NEXT_PUBLIC_MONTHLY_PLAN_PAYMENT_LINK || 'https://buy.stripe.com/test_3cs01sdL0cOrf9SfZ0',
  quarterly: process.env.NEXT_PUBLIC_QUARTERLY_PLAN_PAYMENT_LINK || 'https://buy.stripe.com/test_cN26pQ8qG6q3e5O6or',
};

console.log('Payment Links:', PAYMENT_LINKS);

export default function StripePayment({ 
  planType, 
  buttonText, 
  className = '',
  id
}: StripePaymentProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    // Get current user on component mount
    const getUser = async () => {
      try {
        setIsAuthChecking(true);
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error fetching user:', error);
          setUser(null);
        } else {
          console.log('Current user:', data.user);
          setUser(data.user);
        }
      } catch (err) {
        console.error('Exception in getUser:', err);
        setUser(null);
      } finally {
        setIsAuthChecking(false);
      }
    };
    
    getUser();
  }, [supabase]);

  const handlePayment = async () => {
    console.log(`Starting payment process for ${planType} plan`);
    setIsLoading(true);
    
    try {
      // Check if user is logged in
      if (!user) {
        console.log('User not logged in, redirecting to login page');
        // Store the plan type in local storage so we can redirect after login
        if (typeof window !== 'undefined') {
          localStorage.setItem('selectedPlan', planType);
        }
        // Redirect to login page
        router.push('/login?redirect=/pricing');
        return;
      }
      
      // User is logged in, redirect to appropriate Stripe payment link
      console.log(`User is logged in. User ID: ${user.id}`);
      console.log(`Redirecting to payment link: ${PAYMENT_LINKS[planType]}`);
      window.location.href = PAYMENT_LINKS[planType];
    } catch (error) {
      console.error('Error processing payment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render anything while checking auth to prevent flicker
  if (isAuthChecking) {
    return (
      <button
        id={id}
        disabled={true}
        className={className}
      >
        Checking authentication...
      </button>
    );
  }

  return (
    <button
      id={id}
      onClick={handlePayment}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? 'Processing...' : buttonText}
    </button>
  );
} 