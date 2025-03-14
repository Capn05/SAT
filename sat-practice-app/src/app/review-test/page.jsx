"use client"

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import TopBar from '../components/TopBar'
import ChatSidebar from '../components/ChatSidebar'
import './review.css'
import { MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react'

export default function ReviewTestPage() {
  const [questions, setQuestions] = useState([])
  const [userAnswers, setUserAnswers] = useState([])
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const testId = searchParams.get('testId')
  const [currentPage, setCurrentPage] = useState(1)
  const questionsPerPage = 10

  // Create the Supabase client
  const supabase = createClientComponentClient()

  // Calculate pagination indexes
  const indexOfLastQuestion = currentPage * questionsPerPage
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage
  const currentQuestions = questions.slice(indexOfFirstQuestion, indexOfLastQuestion)
  const totalPages = Math.ceil(questions.length / questionsPerPage)

  // Pagination controls
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Get the current session
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

        // Fetch questions using the existing API route
        const questionsResponse = await fetch(`/api/fetch-test-questions?testId=${testId}`)
        
        if (!questionsResponse.ok) {
          if (questionsResponse.status === 401) {
            router.push('/login')
            return
          }
          throw new Error('Failed to fetch test questions')
        }
        
        const questionsData = await questionsResponse.json()
        
        // Fetch user answers
        const { data: userAnswersData, error: answersError } = await supabase
          .from('official_user_answers')
          .select('*')
          .eq('test_id', testId)
          .eq('user_id', session.user.id)

        if (answersError) throw answersError

        // Match questions with user answers
        const matchedQuestions = questionsData.map(question => {
          const userAnswer = userAnswersData.find(answer => answer.question_id === question.id)
          return {
            ...question,
            userAnswer: userAnswer || null
          }
        })

        // Calculate metrics
        const totalQuestions = matchedQuestions.length
        const correctAnswers = userAnswersData.filter(a => a.is_correct).length
        const incorrectAnswers = totalQuestions - correctAnswers
        const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0

        // Group questions by topic/skill
        const topicPerformance = matchedQuestions.reduce((acc, question) => {
          const topic = question.topic || 'Unknown'
          if (!acc[topic]) {
            acc[topic] = { total: 0, correct: 0 }
          }
          acc[topic].total++
          if (question.userAnswer?.is_correct) acc[topic].correct++
          return acc
        }, {})

        setMetrics({
          accuracy,
          correctAnswers,
          incorrectAnswers,
          topicPerformance
        })

        setQuestions(matchedQuestions)
        setUserAnswers(userAnswersData)

      } catch (error) {
        console.error('Error fetching test data:', error)
        setError('Failed to load test data')
      } finally {
        setLoading(false)
      }
    }

    if (testId) {
      fetchTestData()
    }
  }, [testId, router])

  // Add the parseQuestionText function from TestMode
  const parseQuestionText = (text) => {
    if (!text) return { passage: '', question: '' };
    const parts = text.split(/<br\s*\/?>/i);
    const passage = parts[0];
    const question = parts[1] ? parts[1] : '';
    return { passage, question };
  };

  if (loading) {
    return (
      <div className="review-container">
        <TopBar title="Test Review" />
        <div className="loading-state">Loading test data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="review-container">
        <TopBar title="Test Review" />
        <div className="error-state">{error}</div>
      </div>
    )
  }

  return (
    <div className="review-container" style={{ marginRight: '41%' }}>
      <TopBar title="Test Review" />
      
      <div className="review-content">
        <div className="metrics-section">
          <h2>Performance Overview</h2>
          <div className="metrics-grid">
            <div className="metric-card">
              <h3>Overall Accuracy</h3>
              <div className="metric-value">{metrics?.accuracy.toFixed(1)}%</div>
            </div>
            <div className="metric-card">
              <h3>Questions</h3>
              <div className="metric-details">
                <p>Correct: {metrics?.correctAnswers}</p>
                <p>Incorrect: {metrics?.incorrectAnswers}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="questions-and-content">
          <div className="questions-section">
            <h2>Questions</h2>
            <div className="questions-grid">
              {currentQuestions.map((question, index) => (
                <button
                  key={question.id}
                  className={`question-card ${question.userAnswer?.is_correct ? 'correct' : 'incorrect'}`}
                  onClick={() => setSelectedQuestion(indexOfFirstQuestion + index)}
                >
                  <span className="question-number">Q {indexOfFirstQuestion + index + 1}</span>
                  <span className="status-indicator">
                    {question.userAnswer?.is_correct ? '✓' : '✗'}
                  </span>
                </button>
              ))}
            </div>
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-button"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="page-info">
                {currentPage}
              </div>

              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-button"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {selectedQuestion !== null ? (
            <div className="question-box">
              <div className="question-header">
                <div className="question-number">Question {selectedQuestion + 1}</div>
              </div>
              {(() => {
                const { passage, question } = parseQuestionText(questions[selectedQuestion].question_text);
                return (
                  <>
                    <div className="passage">{passage}</div>
                    <p className="question-text">{question}</p>
                  </>
                )
              })()}
              <div className="choices">
                {questions[selectedQuestion].options.map((option) => (
                  <div
                    key={option.id}
                    className={`choice-button ${option.isCorrect ? 'correct' : ''} ${questions[selectedQuestion].userAnswer?.option_id === option.id ? 'selected' : ''}`}
                  >
                    <span className="choice-letter">{option.value}.</span> {option.text}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="question-placeholder">
              <div className="placeholder-content">
                <MessageCircle size={48} className="placeholder-icon" />
                <h3>Select a Question to Review</h3>
                <p>Choose a question from the list to review it with our AI tutor</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <ChatSidebar 
        questionText={selectedQuestion !== null ? questions[selectedQuestion].question_text : ''}
        selectedAnswer={selectedQuestion !== null ? questions[selectedQuestion].userAnswer?.option_id : ''}
        options={selectedQuestion !== null ? questions[selectedQuestion].options : []}
        imageURL={selectedQuestion !== null ? questions[selectedQuestion].image_url : ''}
      />
    </div>
  )
} 