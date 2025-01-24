"use client"

import { useSearchParams } from 'next/navigation'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import Question from '../components/Question'
import AIChat from '../components/AIChat'
import useAuth from '../../../lib/useAuth'

export default function QuestionPage() {
  useAuth()
  const searchParams = useSearchParams()

  // Access the 'subject_id' query parameter
  const subject = searchParams.get('subject')

    // Log the subject to debug
    console.log('Subject:', subject)
  const Title = subject === '1' ? 'Math' : 'Reading/Writing';

  // Set the title and AI prompt based on the subject
  const aiPrompt = subject ? `Help me with ${subject} questions.` : 'Help me with questions.'

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <TopBar title={Title}/>
        <div style={styles.content}>
        <Question subject={subject} />
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

