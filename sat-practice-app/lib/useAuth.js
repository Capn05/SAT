'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';

const useAuth = () => {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        // Redirect to login if user is not authenticated
        router.push('/login');
      }
    };

    checkUser();
  }, [router]);
};

export default useAuth; 