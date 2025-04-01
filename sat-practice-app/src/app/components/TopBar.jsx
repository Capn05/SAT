"use client"
import { GraduationCap, LogOut } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function TopBar({ title }) {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleDashboardClick = () => {
    router.push('/home')
  }

  const handleReturnToSkills = () => {
    router.push('/skills?subject=1')
  }
  
  const handleReturnTotestDash = () => {
    router.push('/TimedTestDash')
  }
  
  const handleReturnToPreviousPage = () => {
    router.back(); // Navigate back to the previous page
  };
  
  return (
    <div style={styles.header}>
      <div style={styles.titleContainer}>
        <h1 style={styles.title}>{title}</h1>
      </div>
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
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#111827',
    margin: 0,
  }
}

