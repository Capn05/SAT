"use client"
import { GraduationCap, LogOut } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function TopBar({ title }) {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const handleDashboardClick = () => {
    router.push('/home')
  }

  const handleReturnToSkills = () => {
    router.push('/skills')
  }
  const handleReturnTotestDash = () => {
    router.push('/TimedTestDash')
  }
  const handleReturnToPreviousPage = () => {
    router.back(); // Navigate back to the previous page
  };
  return (
    <div style={styles.header}>
      <div style={styles.logoContainer}>
        <GraduationCap style={styles.logo} />
        <h1 style={styles.title}>{title}</h1>
      </div>
      <button onClick={handleLogout} style={styles.logoutButton}>
        <LogOut size={16} style={styles.logoutIcon} />
        <span>Logout</span>
      </button>
    </div>
  )
}

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logo: {
    width: '24px',
    height: '24px',
    color: '#65a30d',
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    margin: 0,
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#fecaca',
    },
  },
  logoutIcon: {
    strokeWidth: 2,
  },
}

