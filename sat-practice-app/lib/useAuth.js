'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from './supabase';

// Create an auth state cache to avoid repeated calls
let authCache = {
  user: null,
  lastChecked: 0,
  checking: false
};

// Time in milliseconds before we re-check auth status
const AUTH_CACHE_DURATION = 60000; // 1 minute

const useAuth = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  
  // Skip auth check for public paths
  if (pathname === '/login' || pathname === '/signup' || 
      pathname === '/forgot-password' || pathname.startsWith('/landing')) {
    return { isChecking: false };
  }

  useEffect(() => {
    let isMounted = true;
    
    const checkUser = async () => {
      if (!isMounted) return;
      
      // If another check is already in progress, wait for it
      if (authCache.checking) {
        const checkInterval = setInterval(() => {
          if (!authCache.checking) {
            clearInterval(checkInterval);
            
            // If we have a cached user, use it
            if (authCache.user) {
              setIsChecking(false);
            } else if (pathname !== '/login') {
              console.log('No cached user found, redirecting to login');
              router.replace('/login');
            }
          }
        }, 100);
        return;
      }
      
      // If we have a recent cached result, use it
      const now = Date.now();
      if (authCache.lastChecked > 0 && 
          now - authCache.lastChecked < AUTH_CACHE_DURATION) {
        
        console.log('Using cached auth state');
        if (!authCache.user && pathname !== '/login') {
          console.log('No cached user found, redirecting to login');
          router.replace('/login');
        }
        
        setIsChecking(false);
        return;
      }
      
      // Mark that we're checking to prevent duplicate calls
      authCache.checking = true;
      
      try {
        console.log('Checking auth status from server');
        // Use getUser which is less likely to trigger token refreshes
        const { data: { user }, error } = await supabase.auth.getUser();

        if (!isMounted) return;
        
        // Update the cache
        authCache.lastChecked = Date.now();
        authCache.user = user || null;
        
        if (error) {
          console.error('Auth check error:', error);
          // Only redirect on specific auth errors
          if (error.status === 401) {
            router.replace('/login');
          }
          return;
        }

        if (!user && pathname !== '/login') {
          console.log('No user found, redirecting to login');
          router.replace('/login');
        }
      } catch (error) {
        console.error('Error in auth check:', error);
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
        authCache.checking = false;
      }
    };

    checkUser();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        
        // Update the cache when auth state changes
        if (event === 'SIGNED_IN' && session?.user) {
          authCache.user = session.user;
          authCache.lastChecked = Date.now();
        } else if (event === 'SIGNED_OUT') {
          authCache.user = null;
          authCache.lastChecked = Date.now();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { isChecking };
};

export default useAuth; 