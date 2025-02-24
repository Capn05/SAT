'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function QuickPracticeButton({ subject }) {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleQuickPractice = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found, redirecting to login');
        router.push('/login');
        return;
      }

      const url = `/practice?mode=quick&subject=${subject}`;
      router.push(url);
    } catch (error) {
      console.error('Error starting quick practice:', error);
      router.push('/login');
    }
  };

  return (
    <button 
      onClick={handleQuickPractice}
      style={styles.button}
    >
      Quick Practice
    </button>
  );
}

const styles = {
  button: {
    padding: '12px 24px',
    backgroundColor: '#65a30d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#4d7c0f',
    },
  },
}; 