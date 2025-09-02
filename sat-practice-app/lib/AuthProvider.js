'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { usePathname, useRouter } from 'next/navigation';

// Create context for auth state
const AuthContext = createContext({
  user: null,
  loading: true,
});

// Create a provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  
  // Public paths that don't require authentication
  const publicPaths = ['/login', '/signup', '/forgot-password', '/reset-password', '/auth/reset-redirect', '/auth/handle-auth', '/privacy', '/terms'];
  const isPublicPath = 
    publicPaths.includes(pathname) || 
    pathname === '/' || 
    pathname.startsWith('/landing');
  
  useEffect(() => {
    // Prevent multiple simultaneous auth checks
    let isMounted = true;
    let checkInProgress = false;
    
    // Track the last auth check time to throttle requests
    const AUTH_CHECK_THROTTLE = 10000; // 10 seconds
    let lastAuthCheck = 0;
    
    // Check for existing session
    const checkUser = async () => {
      // Prevent concurrent checks and throttle checks
      if (checkInProgress || (Date.now() - lastAuthCheck < AUTH_CHECK_THROTTLE && user)) {
        return;
      }
      
      checkInProgress = true;
      
      try {
        // Try to get user from localStorage first
        const localUser = localStorage.getItem('supabase.auth.user');
        const now = Date.now();
        lastAuthCheck = now;
        
        if (localUser) {
          try {
            const parsedUser = JSON.parse(localUser);
            // Validate the user object has expected properties
            if (parsedUser && parsedUser.id && parsedUser.email) {
              // Only update state if component is still mounted
              if (isMounted) {
                setUser(parsedUser);
              }
              
              // Check if we need to verify with the server
              // Only do this if we haven't checked recently
              const lastServerCheck = localStorage.getItem('supabase.auth.lastServerCheck');
              if (!lastServerCheck || (now - parseInt(lastServerCheck, 10)) > 60000) { // 1 minute
                const { data: { user: serverUser }, error } = await supabase.auth.getUser();
                localStorage.setItem('supabase.auth.lastServerCheck', now.toString());
                
                if (serverUser) {
                  // Update if server has newer data
                  localStorage.setItem('supabase.auth.user', JSON.stringify(serverUser));
                  if (isMounted) {
                    setUser(serverUser);
                  }
                } else if (!isPublicPath && !error) {
                  // Local storage has user but server doesn't - user likely signed out elsewhere
                  localStorage.removeItem('supabase.auth.user');
                  if (isMounted) {
                    setUser(null);
                    router.replace('/login');
                  }
                }
              }
            } else {
              // Invalid user data in localStorage
              localStorage.removeItem('supabase.auth.user');
              const { data: { user: serverUser }, error } = await supabase.auth.getUser();
              localStorage.setItem('supabase.auth.lastServerCheck', now.toString());
              
              if (serverUser) {
                localStorage.setItem('supabase.auth.user', JSON.stringify(serverUser));
                if (isMounted) {
                  setUser(serverUser);
                }
              } else if (!isPublicPath) {
                if (isMounted) {
                  router.replace('/login');
                }
              }
            }
          } catch (parseError) {
            // Handle JSON parse error (corrupted localStorage)
            console.error('Failed to parse user from localStorage:', parseError);
            localStorage.removeItem('supabase.auth.user');
            const { data: { user: serverUser }, error } = await supabase.auth.getUser();
            localStorage.setItem('supabase.auth.lastServerCheck', now.toString());
            
            if (serverUser) {
              localStorage.setItem('supabase.auth.user', JSON.stringify(serverUser));
              if (isMounted) {
                setUser(serverUser);
              }
            } else if (!isPublicPath) {
              if (isMounted) {
                router.replace('/login');
              }
            }
          }
        } else {
          // If no local user, check with server
          const { data: { user: serverUser }, error } = await supabase.auth.getUser();
          
          if (error && !isPublicPath) {
            console.error('Auth error:', error);
            router.replace('/login');
            return;
          }
          
          if (serverUser) {
            // Store user in local storage for future quick access
            localStorage.setItem('supabase.auth.user', JSON.stringify(serverUser));
            localStorage.setItem('supabase.auth.lastServerCheck', now.toString());
            if (isMounted) {
              setUser(serverUser);
            }
          } else if (!isPublicPath) {
            router.replace('/login');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        if (!isPublicPath) {
          router.replace('/login');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
        checkInProgress = false;
      }
    };

    checkUser();
    
    // Add a safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (loading && isMounted) {
        console.warn('Auth loading timed out, forcing completion');
        setLoading(false);
        
        // If we're not on a public path and loading timed out, redirect to login
        if (!isPublicPath) {
          router.replace('/login');
        }
      }
    }, 5000); // 5 second timeout

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          localStorage.setItem('supabase.auth.user', JSON.stringify(session.user));
          localStorage.setItem('supabase.auth.lastServerCheck', Date.now().toString());
          if (isMounted) {
            setUser(session.user);
          }
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('supabase.auth.user');
          localStorage.removeItem('supabase.auth.lastServerCheck');
          if (isMounted) {
            setUser(null);
          
            // Only redirect to login if not already on a public path
            if (!isPublicPath) {
              router.replace('/login');
            }
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [router, isPublicPath, pathname]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
} 