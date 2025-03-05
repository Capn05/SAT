"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import TopBar from '../components/TopBar'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { useRouter } from 'next/navigation'

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    questionsAnswered: 0,
    correctAnswers: 0,
    accuracyPercentage: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          router.push('/login')
          return
        }
        
        if (!session) {
          console.log('No valid session found')
          router.push('/login')
          return
        }

        const response = await fetch(`/api/user-stats?userId=${session.user.id}`)
        const data = await response.json()

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login')
            return
          }
          throw new Error(data.error || 'Failed to fetch stats')
        }

        setStats(data.stats)
      } catch (error) {
        console.error('Error fetching user stats:', error)
        setError('Failed to load analytics data')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [router])

  const chartData = [
    {
      name: 'Questions',
      total: stats.questionsAnswered,
      correct: stats.correctAnswers,
      incorrect: stats.questionsAnswered - stats.correctAnswers
    }
  ]

  if (loading) {
    return <div>Loading...</div>
  }
  
  if (error) {
    return <div>{error}</div>
  }

  return (
    <div style={styles.container}>
      <TopBar title="Detailed Analytics" />
      
      <div style={styles.content}>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h3>Total Questions Answered</h3>
            <p style={styles.statValue}>{stats.questionsAnswered}</p>
          </div>
          
          <div style={styles.statCard}>
            <h3>Correct Answers</h3>
            <p style={styles.statValue}>{stats.correctAnswers}</p>
          </div>
          
          <div style={styles.statCard}>
            <h3>Accuracy Rate</h3>
            <p style={styles.statValue}>{stats.accuracyPercentage.toFixed(1)}%</p>
          </div>
        </div>

        <div style={styles.chartContainer}>
          <h3>Performance Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="correct" fill="#65a30d" name="Correct" />
              <Bar dataKey="incorrect" fill="#ef4444" name="Incorrect" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb'
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
    marginBottom: '40px'
  },
  statCard: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
    textAlign: 'center'
  },
  statValue: {
    fontSize: '36px',
    fontWeight: '600',
    color: '#111827',
    marginTop: '8px'
  },
  chartContainer: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)'
  }
} 