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
  const [authenticated, setAuthenticated] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Log authentication attempt
        console.log('Checking authentication status');
        
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
          console.error('Authentication error:', error.message);
          setLoading(false);
          return;
        }

        if (!user) {
          console.log('No user authenticated');
          setLoading(false);
          return;
        }

        // User is authenticated
        console.log('User authenticated:', user.email);
        setUser(user);
        setAuthenticated(true);

        // Check subscription status - but don't redirect
        try {
          const subscriptionData = await checkSubscription(user.id);
          console.log('Subscription status:', subscriptionData);
          setSubscription(subscriptionData);
          setSubscribed(subscriptionData.active);
        } catch (subError) {
          console.error('Error checking subscription:', subError);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error in useAuth:', error);
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  // Separate function to handle required authentication redirects
  const requireAuth = () => {
    if (!loading && !authenticated) {
      router.push('/login');
      return false;
    }
    return true;
  };

  // Function to check if user has subscription
  const requireSubscription = () => {
    if (!loading && authenticated && !subscribed) {
      router.push('/pricing');
      return false;
    }
    return authenticated && subscribed;
  };

  return { 
    user, 
    subscription, 
    loading, 
    authenticated, 
    subscribed,
    requireAuth,
    requireSubscription
  };
};

export default useAuth; 