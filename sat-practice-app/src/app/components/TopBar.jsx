"use client"
import { House } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function TopBar({ title}) {
  const router = useRouter()

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error logging out:', error.message)
    } else {
      router.push('/login')
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
    <div style={styles.topBar}>
      {/* <div style={styles.analytics}> */}
        {/* <div onClick={handleDashboardClick}>
          <House style={styles.icon} />
        </div> */}
        <span>{title}</span>
      {/* </div> */}
      <div style={styles.actions}>
        {title !== "SAT Skills" && <button style={styles.secondaryButton} onClick={handleReturnToPreviousPage}>Back</button>}
        <button style={styles.primaryButton} onClick={handleLogout}>Log Out</button>
      </div>
    </div>
  )
}

const styles = {
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid #e5e7eb',
  },
  analytics: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '16px',
    fontWeight: 500,
  },
  icon: {
    width: '20px',
    height: '20px',
  },
  actions: {
    display: 'flex',
    gap: '12px',
  },
  primaryButton: {
    padding: '8px 16px',
    backgroundColor: '#65a30d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  secondaryButton: {
    padding: '8px 16px',
    backgroundColor: '#e6f0e6',
    color: '#333',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
}

