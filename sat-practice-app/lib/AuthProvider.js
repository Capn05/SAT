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
  const publicPaths = ['/login', '/signup', '/forgot-password', '/reset-password', '/auth/reset-redirect', '/auth/handle-auth'];
  const isPublicPath = 
    publicPaths.includes(pathname) || 
    pathname === '/' || 
    pathname.startsWith('/landing');
  
  useEffect(() => {
    // Check for existing session
    const checkUser = async () => {
      try {
        // Try to get user from localStorage first
        const localUser = localStorage.getItem('supabase.auth.user');
        
        if (localUser) {
          try {
            const parsedUser = JSON.parse(localUser);
            // Validate the user object has expected properties
            if (parsedUser && parsedUser.id && parsedUser.email) {
              setUser(parsedUser);
              // Even with local storage data, still verify with server in background
              const { data: { user: serverUser }, error } = await supabase.auth.getUser();
              if (serverUser) {
                // Update if server has newer data
                localStorage.setItem('supabase.auth.user', JSON.stringify(serverUser));
                setUser(serverUser);
              } else if (!isPublicPath && !error) {
                // Local storage has user but server doesn't - user likely signed out elsewhere
                localStorage.removeItem('supabase.auth.user');
                setUser(null);
                router.replace('/login');
              }
            } else {
              // Invalid user data in localStorage
              localStorage.removeItem('supabase.auth.user');
              const { data: { user: serverUser }, error } = await supabase.auth.getUser();
              if (serverUser) {
                localStorage.setItem('supabase.auth.user', JSON.stringify(serverUser));
                setUser(serverUser);
              } else if (!isPublicPath) {
                router.replace('/login');
              }
            }
          } catch (parseError) {
            // Handle JSON parse error (corrupted localStorage)
            console.error('Failed to parse user from localStorage:', parseError);
            localStorage.removeItem('supabase.auth.user');
            const { data: { user: serverUser }, error } = await supabase.auth.getUser();
            if (serverUser) {
              localStorage.setItem('supabase.auth.user', JSON.stringify(serverUser));
              setUser(serverUser);
            } else if (!isPublicPath) {
              router.replace('/login');
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
            setUser(serverUser);
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
        setLoading(false);
      }
    };

    checkUser();
    
    // Add a safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (loading) {
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
          setUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('supabase.auth.user');
          setUser(null);
          
          // Only redirect to login if not already on a public path
          if (!isPublicPath) {
            router.replace('/login');
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, [router, isPublicPath, pathname, loading]);

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