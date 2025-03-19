'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';
import { checkSubscription } from './payment';

const useAuth = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          // Redirect to login if user is not authenticated
          router.push('/login');
          return;
        }

        setUser(user);

        // Check subscription status
        const subscriptionData = await checkSubscription(user.id);
        setSubscription(subscriptionData);

        // If user is not subscribed, redirect to pricing page
        if (!subscriptionData.active) {
          router.push('/pricing');
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Error in useAuth:', error);
        router.push('/login');
      }
    };

    checkUser();
  }, [router]);

  return { user, subscription, loading };
};

export default useAuth; 