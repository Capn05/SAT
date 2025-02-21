"use client"

import { useState, useEffect } from "react"
import { supabase } from '../../../lib/supabase'
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

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    questionsAnswered: 0,
    correctAnswers: 0,
    accuracyPercentage: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !sessionData.session) {
          console.log('No valid session found')
          return
        }

        const { user } = sessionData.session

        if (!user) {
          console.log('No user found in session')
          return
        }

        const response = await fetch(`/api/user-stats?userId=${user.id}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch stats')
        }

        setStats(data.stats)
      } catch (error) {
        console.error('Error fetching user stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

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