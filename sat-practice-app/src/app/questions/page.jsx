"use client"

import { useSearchParams } from 'next/navigation'
import TopBar from '../components/TopBar'
import Question from '../components/Question'
import useAuth from '../../../lib/useAuth'

export default function QuestionPage() {
  useAuth()
  const searchParams = useSearchParams()

  // Access the 'subject', 'mode', and 'skillName' query parameters
  const subject = searchParams.get('subject')
  const mode = searchParams.get('mode') || 'skill'; // Default to skill-specific questions if no mode is provided
  const skillName = searchParams.get('skillName'); // Retrieve the skill name

  const Title = `${subject === '1' ? 'Math' : 'Reading/Writing'}${mode === 'quick' ? ' - Quick Practice' : (mode === 'skill' ? '' : ` - ${mode}`)}${skillName ? `: ${skillName}` : ''}`;

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <TopBar title={Title} />
        <div style={styles.content}>
          <Question subject={subject} mode={mode} skillName={skillName}/>
        </div>
      </main>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
}

