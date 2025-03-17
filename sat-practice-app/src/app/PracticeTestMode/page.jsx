"use client"

import { useState, useEffect, useRef } from "react"
import { Bookmark, ChevronLeft, ChevronRight, Eye, MoreVertical, Flag, MessageCircle, Clock } from "lucide-react"
import { formatTime } from "../lib/utils"
import TopBar from "../components/TopBar"
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function PracticeTestPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [answers, setAnswers] = useState({})
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set())
  const [showQuestionNav, setShowQuestionNav] = useState(false)
  const [questions, setQuestions] = useState([])
  const [moduleInfo, setModuleInfo] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [testComplete, setTestComplete] = useState(false)
  const [currentScore, setCurrentScore] = useState(null)
  const [overallScore, setOverallScore] = useState(null)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [practiceTestInfo, setPracticeTestInfo] = useState(null)
  const [showScoreModal, setShowScoreModal] = useState(false)
  const timerRef = useRef(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const testId = searchParams.get('testId')
  const moduleId = searchParams.get('moduleId')
  
  const supabase = createClientComponentClient()
  
  const totalQuestions = questions.length
  
  useEffect(() => {
    // Fetch practice test info
    const fetchPracticeTestInfo = async () => {
      if (!testId) {
        setError("Test ID is required")
        return
      }
      
      try {
        const { data, error } = await supabase
          .from('practice_tests')
          .select(`
            id,
            name,
            subject_id,
            subjects(subject_name)
          `)
          .eq('id', testId)
          .single()
        
        if (error) {
          console.error('Error fetching practice test:', error)
          setError("Error loading test information")
          return
        }
        
        setPracticeTestInfo(data)
        
        // If no moduleId is provided, fetch the first module
        if (!moduleId) {
          fetchModule1()
        }
      } catch (err) {
        console.error("Error fetching practice test info:", err)
        setError("An unexpected error occurred while loading test information")
      }
    }
    
    // Fetch Module 1 if no moduleId is provided
    const fetchModule1 = async () => {
      try {
        const { data, error } = await supabase
          .from('test_modules')
          .select('id')
          .eq('practice_test_id', testId)
          .eq('module_number', 1)
          .single()
        
        if (error) {
          console.error('Error fetching module 1:', error)
          setError("Error loading test module")
          return
        }
        
        // Navigate to the same page but with moduleId parameter
        router.replace(`/PracticeTestMode?testId=${testId}&moduleId=${data.id}`)
      } catch (err) {
        console.error("Error fetching module 1:", err)
        setError("An unexpected error occurred while loading test module")
      }
    }
    
    if (testId) {
      fetchPracticeTestInfo()
    } else {
      setError("No test ID provided")
    }
  }, [testId, router])
  
  // Fetch questions for the current module
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!moduleId) return
      
      setIsLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/practice-test-questions?moduleId=${moduleId}`)
        const data = await response.json()
        
        if (!response.ok) {
          setError(data.error || "Failed to load questions")
          setIsLoading(false)
          return
        }
        
        // Reset state for new module
        setQuestions(data.questions)
        setModuleInfo(data.moduleInfo)
        setCurrentQuestion(0)
        setAnswers({})
        setFlaggedQuestions(new Set())
        
        // Set time limit based on subject
        const subjectId = data.moduleInfo.subjectId
        setTimeRemaining(subjectId === 1 ? 35 * 60 : 32 * 60) // 35 min for Math, 32 min for Reading & Writing
        
        setIsLoading(false)
      } catch (err) {
        console.error("Error fetching questions:", err)
        setError("An unexpected error occurred while loading questions")
        setIsLoading(false)
      }
    }
    
    if (moduleId) {
      fetchQuestions()
    }
  }, [moduleId])
  
  // Timer logic
  useEffect(() => {
    if (timeRemaining === null || isLoading || error || testComplete) return
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          handleSubmitModule()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [timeRemaining, isLoading, error, testComplete])
  
  const handleAnswer = (questionId, optionId, isCorrect) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { optionId, isCorrect }
    }))
  }
  
  const toggleFlagged = (questionId) => {
    setFlaggedQuestions(prev => {
      const newFlagged = new Set(prev)
      if (newFlagged.has(questionId)) {
        newFlagged.delete(questionId)
      } else {
        newFlagged.add(questionId)
      }
      return newFlagged
    })
  }
  
  const getQuestionStatus = (index) => {
    const question = questions[index]
    if (!question) return 'unanswered'
    
    const answered = answers[question.id] !== undefined
    const flagged = flaggedQuestions.has(question.id)
    
    if (answered && flagged) return 'answered-flagged'
    if (answered) return 'answered'
    if (flagged) return 'flagged'
    return 'unanswered'
  }
  
  const navigateQuestion = (direction) => {
    setCurrentQuestion(prev => {
      const next = prev + direction
      return Math.max(0, Math.min(totalQuestions - 1, next))
    })
  }
  
  const handleSubmitClick = () => {
    // Only open submit modal if at least one question is answered
    if (Object.keys(answers).length > 0) {
      setShowSubmitModal(true)
      // Pause timer
      clearInterval(timerRef.current)
    }
  }
  
  const handleSubmitModule = async () => {
    setShowSubmitModal(false)
    setIsLoading(true)
    
    try {
      // Format answers for submission
      const formattedAnswers = Object.entries(answers).map(([questionId, data]) => ({
        questionId: parseInt(questionId),
        selectedOptionId: data.optionId,
        isCorrect: data.isCorrect
      }))
      
      const response = await fetch('/api/submit-practice-module', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          moduleId,
          answers: formattedAnswers
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit answers")
      }
      
      // Store the current score
      setCurrentScore(data.score)
      
      // If overall score is available (test completed), store it
      if (data.overallScore) {
        setOverallScore(data.overallScore)
      }
      
      // Module is complete
      if (data.moduleComplete) {
        // If next module is available, navigate to it
        if (data.nextModule) {
          // Show score modal with continuation option
          setShowScoreModal(true)
          setTestComplete(false)
          
          // Automatically continue to next module after 5 seconds
          setTimeout(() => {
            if (!testComplete) {
              router.push(`/PracticeTestMode?testId=${testId}&moduleId=${data.nextModule.id}`)
              setShowScoreModal(false)
            }
          }, 5000)
        } 
        // Test is fully complete
        else if (data.testComplete) {
          setTestComplete(true)
          setShowScoreModal(true)
        }
      }
    } catch (err) {
      console.error("Error submitting module:", err)
      setError("Failed to submit your answers. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleScoreModalClose = () => {
    setShowScoreModal(false)
    if (testComplete) {
      router.push(`/TimedTestDash`) // Navigate back to test dashboard
    }
  }
  
  const ScoreModal = ({ score, isModule1, onClose }) => (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h2 style={styles.modalTitle}>
          {testComplete ? "Test Complete!" : "Module Complete!"}
        </h2>
        
        <div style={styles.scoreContainer}>
          <h3 style={styles.scoreLabel}>Your Score:</h3>
          <p style={styles.scoreValue}>
            {score.correct} / {score.total} ({Math.round(score.percentage)}%)
          </p>
          
          {testComplete && overallScore && (
            <>
              <h3 style={styles.scoreLabel}>Overall Test Score:</h3>
              <p style={styles.scoreValue}>
                {Math.round(overallScore.percentage)}%
              </p>
            </>
          )}
        </div>
        
        {!testComplete && (
          <p style={styles.modalMessage}>
            Proceeding to {isModule1 ? "Module 2" : "next module"} in 5 seconds...
          </p>
        )}
        
        <button style={styles.modalButton} onClick={onClose}>
          {testComplete ? "Return to Dashboard" : "Continue Now"}
        </button>
      </div>
    </div>
  )
  
  const SubmitModal = ({ onSubmit, onCancel }) => (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h2 style={styles.modalTitle}>Submit Module?</h2>
        <p style={styles.modalText}>
          You have answered {Object.keys(answers).length} of {totalQuestions} questions.
          Are you sure you want to submit?
        </p>
        <div style={styles.modalButtons}>
          <button style={styles.cancelButton} onClick={onCancel}>
            Return to Test
          </button>
          <button style={styles.submitButton} onClick={onSubmit}>
            Submit Module
          </button>
        </div>
      </div>
    </div>
  )
  
  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <TopBar title="Practice Test" />
        <div style={styles.loadingContent}>
          <div style={styles.loadingSpinner}></div>
          <p>Loading test questions...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div style={styles.errorContainer}>
        <TopBar title="Practice Test" />
        <div style={styles.errorContent}>
          <h2>Error</h2>
          <p>{error}</p>
          <button 
            style={styles.backButton} 
            onClick={() => router.push('/TimedTestDash')}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }
  
  const currentQuestionData = questions[currentQuestion]
  
  if (!currentQuestionData) {
    return (
      <div style={styles.errorContainer}>
        <TopBar title="Practice Test" />
        <div style={styles.errorContent}>
          <h2>No Questions Available</h2>
          <p>This test module doesn't have any questions.</p>
          <button 
            style={styles.backButton} 
            onClick={() => router.push('/TimedTestDash')}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }
  
  const selectedOptionId = answers[currentQuestionData.id]?.optionId
  
  return (
    <div style={styles.container}>
      <TopBar 
        title={`${practiceTestInfo?.name || 'Practice Test'} - Module ${moduleInfo?.moduleNumber || ''}`} 
      />
      
      <div style={styles.testHeader}>
        <div style={styles.testInfo}>
          <h2 style={styles.testName}>
            {practiceTestInfo?.subjects?.subject_name || 'Test'} - 
            {moduleInfo?.moduleNumber === 1 ? ' Module 1' : 
             moduleInfo?.isHarder ? ' Module 2 (Higher Difficulty)' : ' Module 2 (Lower Difficulty)'}
          </h2>
          <div style={styles.questionNumber}>
            Question {currentQuestion + 1} of {totalQuestions}
          </div>
        </div>
        
        <div style={styles.timer}>
          <Clock size={20} />
          <span>{formatTime(timeRemaining)}</span>
        </div>
      </div>
      
      <div style={styles.mainContent}>
        <div style={styles.questionContainer}>
          {currentQuestionData.image_url && (
            <div style={styles.imageContainer}>
              <img 
                src={currentQuestionData.image_url} 
                alt="Question visual" 
                style={styles.questionImage} 
              />
            </div>
          )}
          
          <div style={styles.questionText}>
            {currentQuestionData.question_text}
          </div>
          
          <div style={styles.optionsContainer}>
            {currentQuestionData.options.map((option) => (
              <div
                key={option.id}
                style={{
                  ...styles.option,
                  ...(selectedOptionId === option.id ? styles.selectedOption : {})
                }}
                onClick={() => handleAnswer(currentQuestionData.id, option.id, option.isCorrect)}
              >
                <div style={styles.optionLetter}>{option.value}</div>
                <div style={styles.optionText}>{option.label}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div style={styles.questionNavigation}>
          <button
            style={styles.navButton}
            onClick={() => navigateQuestion(-1)}
            disabled={currentQuestion === 0}
          >
            <ChevronLeft size={20} />
            Previous
          </button>
          
          <button
            style={styles.flagButton}
            onClick={() => toggleFlagged(currentQuestionData.id)}
          >
            <Flag
              size={20}
              style={{ fill: flaggedQuestions.has(currentQuestionData.id) ? "#ef4444" : "none" }}
            />
            {flaggedQuestions.has(currentQuestionData.id) ? "Unflag" : "Flag"}
          </button>
          
          {currentQuestion < totalQuestions - 1 ? (
            <button
              style={styles.navButton}
              onClick={() => navigateQuestion(1)}
            >
              Next
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              style={styles.submitButton}
              onClick={handleSubmitClick}
            >
              Submit
            </button>
          )}
        </div>
        
        <button
          style={styles.questionListToggle}
          onClick={() => setShowQuestionNav(!showQuestionNav)}
        >
          {showQuestionNav ? "Hide Question List" : "Show Question List"}
        </button>
        
        {showQuestionNav && (
          <div style={styles.questionList}>
            {questions.map((_, index) => (
              <div
                key={index}
                style={{
                  ...styles.questionItem,
                  ...(currentQuestion === index ? styles.currentQuestionItem : {}),
                  ...styles[getQuestionStatus(index)]
                }}
                onClick={() => setCurrentQuestion(index)}
              >
                {index + 1}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {showSubmitModal && (
        <SubmitModal
          onSubmit={handleSubmitModule}
          onCancel={() => {
            setShowSubmitModal(false)
            // Resume timer
            if (!testComplete && timeRemaining > 0) {
              timerRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                  if (prev <= 1) {
                    clearInterval(timerRef.current)
                    handleSubmitModule()
                    return 0
                  }
                  return prev - 1
                })
              }, 1000)
            }
          }}
        />
      )}
      
      {showScoreModal && currentScore && (
        <ScoreModal
          score={currentScore}
          isModule1={moduleInfo?.moduleNumber === 1}
          onClose={handleScoreModalClose}
        />
      )}
    </div>
  )
}

const styles = {
  container: {
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f9fafb',
  },
  testHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
  },
  testInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  testName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
  },
  questionNumber: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '4px',
  },
  timer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '16px',
    fontWeight: '500',
    color: '#111827',
    backgroundColor: '#f3f4f6',
    padding: '8px 16px',
    borderRadius: '6px',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '2rem',
    overflowY: 'auto',
  },
  questionContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '2rem',
    marginBottom: '1.5rem',
  },
  imageContainer: {
    maxWidth: '100%',
    marginBottom: '1.5rem',
  },
  questionImage: {
    maxWidth: '100%',
    borderRadius: '4px',
  },
  questionText: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#111827',
    marginBottom: '2rem',
  },
  optionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  option: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    padding: '1rem',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: 'white',
  },
  selectedOption: {
    border: '2px solid #4f46e5',
    backgroundColor: '#eef2ff',
  },
  optionLetter: {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    fontSize: '14px',
    fontWeight: '600',
  },
  optionText: {
    flex: 1,
    fontSize: '15px',
    color: '#1f2937',
  },
  questionNavigation: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
    marginBottom: '2rem',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    color: '#4b5563',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  submitButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#4f46e5',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  flagButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    color: '#4b5563',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  questionListToggle: {
    alignSelf: 'center',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    color: '#4b5563',
    fontSize: '14px',
    cursor: 'pointer',
  },
  questionList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginTop: '1rem',
    justifyContent: 'center',
  },
  questionItem: {
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    color: '#4b5563',
    fontSize: '14px',
    cursor: 'pointer',
  },
  currentQuestionItem: {
    border: '2px solid #4f46e5',
  },
  answered: {
    backgroundColor: '#bbf7d0',
    borderColor: '#4ade80',
    color: '#166534',
  },
  flagged: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
    color: '#b91c1c',
  },
  'answered-flagged': {
    backgroundImage: 'linear-gradient(135deg, #bbf7d0 50%, #fee2e2 50%)',
    borderColor: '#4f46e5',
    color: '#1f2937',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '2rem',
    maxWidth: '500px',
    width: '90%',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#111827',
    marginTop: 0,
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  modalText: {
    fontSize: '16px',
    color: '#4b5563',
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
  },
  cancelButton: {
    flex: 1,
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    color: '#4b5563',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  submitButton: {
    flex: 1,
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#4f46e5',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  scoreContainer: {
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  scoreLabel: {
    fontSize: '16px',
    color: '#4b5563',
    marginBottom: '0.5rem',
  },
  scoreValue: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '1.5rem',
  },
  modalMessage: {
    fontSize: '16px',
    color: '#4b5563',
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  modalButton: {
    display: 'block',
    width: '100%',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#4f46e5',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'center',
  },
  loadingContainer: {
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  loadingContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(0, 0, 0, 0.1)',
    borderTop: '3px solid #4f46e5',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorContainer: {
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  errorContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    padding: '2rem',
    textAlign: 'center',
  },
  backButton: {
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#4f46e5',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '1rem',
  },
} 