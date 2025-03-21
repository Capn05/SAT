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

const PAYMENT_LINKS = {
  monthly: 'https://buy.stripe.com/test_8wM01s22i4hV5zi4gg', // Monthly plan link
  quarterly: 'https://buy.stripe.com/test_8wMcOedL015J2n6cMN', // 3-month plan link
};

export default function StripePayment({ 
  planType, 
  buttonText, 
  className = '',
  id
}: StripePaymentProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Get current user on component mount
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
  }, [supabase]);

  const handlePayment = async () => {
    setIsLoading(true);
    
    try {
      // Check if user is logged in
      if (!user) {
        // Store the plan type in local storage so we can redirect after login
        localStorage.setItem('selectedPlan', planType);
        // Redirect to login page
        router.push('/login?redirect=/pricing');
        return;
      }
      
      // User is logged in, redirect to appropriate Stripe payment link
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