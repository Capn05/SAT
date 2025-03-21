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
  monthly: process.env.NEXT_PUBLIC_MONTHLY_PLAN_PAYMENT_LINK || 'https://buy.stripe.com/test_8wM01s22i4hV5zi4gg',
  quarterly: process.env.NEXT_PUBLIC_QUARTERLY_PLAN_PAYMENT_LINK || 'https://buy.stripe.com/test_8wMcOedL015J2n6cMN',
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

  useEffect(() => {
    // Get current user on component mount
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      console.log('Current user:', data.user);
      setUser(data.user);
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
        localStorage.setItem('selectedPlan', planType);
        // Redirect to login page
        router.push('/login?redirect=/pricing');
        return;
      }
      
      // User is logged in, redirect to appropriate Stripe payment link
      console.log(`Redirecting to payment link: ${PAYMENT_LINKS[planType]}`);
      window.location.href = PAYMENT_LINKS[planType];
    } catch (error) {
      console.error('Error processing payment:', error);
    } finally {
      setIsLoading(false);
    }
  };

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