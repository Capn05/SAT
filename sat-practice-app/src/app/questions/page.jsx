"use client"

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import TopBar from '../components/TopBar'
import Question from '../components/Question'
import useAuth from '../../../lib/useAuth'

// Create a client component for content
function QuestionPageContent() {
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

// Main component with Suspense boundary
export default function QuestionPage() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: 'white'
      }}>
        <div>Loading question...</div>
      </div>
    }>
      <QuestionPageContent />
    </Suspense>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: 'white'
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

