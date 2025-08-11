"use client"

import { useState, useEffect, Suspense } from "react"
import { Bookmark, ChevronLeft, ChevronRight, Eye, MoreVertical, Flag, MessageCircle, Clock } from "lucide-react"
import { formatTime } from "../lib/utils"
import "./test.css"
import TopBar from "../components/TopBar"
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import 'katex/dist/katex.min.css'
import { renderMathContent as renderMathFromModule } from '../components/MathRenderer'

const mockQuestions = [
  {
    id: 1,
    passage:
      "Researchers and conservationists stress that biodiversity loss due to invasive species is _____. For example, people can take simple steps such as washing their footwear after travel to avoid introducing potentially invasive organisms into new environments.",
    text: "Which choice completes the text with the most logical and precise word or phrase?",
    choices: [
      { id: "A", text: "preventable" },
      { id: "B", text: "undeniable" },
      { id: "C", text: "common" },
      { id: "D", text: "concerning" },
    ],
  },
  // Add more mock questions as needed
]

// Create a client component for the content
function TestModeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const testId = searchParams.get('testId')
  const testType = searchParams.get('type') // Get type from searchParams
  
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [timeRemaining, setTimeRemaining] = useState(testType === "math" ? 2100 : 1920) // 70 or 64 minutes
  const [answers, setAnswers] = useState({})
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set())
  const [showQuestionNav, setShowQuestionNav] = useState(false)
  const [questions, setQuestions] = useState([])
  const totalQuestions = questions.length
  const [testName, setTestName] = useState('')
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [testResults, setTestResults] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()
  const [showTimerWarning, setShowTimerWarning] = useState(false)

  useEffect(() => {
    if (testId) {
      console.log("Test ID:", testId)
    }
  }, [testId])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === 300) {
          setShowTimerWarning(true)
        }
        if (prev <= 1) {
          clearInterval(timer)
          handleSubmitTest()
          return 0
        }
        return prev > 0 ? prev - 1 : 0
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (showTimerWarning) {
      alert("5 minutes remaining!")
      setShowTimerWarning(false)
    }
  }, [showTimerWarning])

  useEffect(() => {
    const fetchTestData = async () => {
      setIsLoading(true)
      if (!testId) return;

      // Fetch test details including name
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .select('name')
        .eq('id', testId)
        .single();

      if (testError) {
        console.error('Error fetching test details:', testError);
      } else if (testData) {
        setTestName(testData.name);
      }

      // Existing questions fetch
      const response = await fetch(`/api/fetch-test-questions?testId=${testId}`);
      const data = await response.json();
      if (response.ok) {
        setQuestions(data);
      } else {
        console.error('Error fetching questions:', data.error);
      }
      setIsLoading(false)
    };

    if (testId) {
      fetchTestData();
    }
  }, [testId, supabase]);

  const hasMath = (content) => typeof content === 'string' && /\$/.test(content);

  const handleAnswer = async (questionId, choice) => {
    // Update local state first
    setAnswers((prev) => ({ ...prev, [questionId]: choice }))

    try {
      // Get the current user from Supabase
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        return;
      }

      // Get the current question data to check if the answer is correct
      const currentQuestionData = questions[currentQuestion - 1];
      console.log('Current question data:', currentQuestionData);
      
      const selectedOption = currentQuestionData.options.find(opt => opt.id === choice);
      console.log('Selected option:', selectedOption);
      
      if (!selectedOption) {
        console.error('Selected option not found:', { choice, options: currentQuestionData.options });
        return;
      }

      const isCorrect = selectedOption.isCorrect;
      
      const requestBody = {
        user_id: user.id,
        question_id: currentQuestionData.id,
        option_id: choice,
        is_correct: isCorrect,
        test_id: testId
      };
      
      console.log('Sending request with body:', requestBody);

      const response = await fetch('/api/upload-test-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Failed to save answer:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        });
      } else {
        console.log('Successfully saved answer:', responseData);
      }
    } catch (error) {
      console.error('Error in handleAnswer:', error);
    }
  }

  const toggleFlagged = (questionId) => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const getQuestionStatus = (questionId) => {
    let status = []
    if (questionId === currentQuestion) return "current"
    if (flaggedQuestions.has(questionId)) status.push("flagged")
    if (answers[questionId]) status.push("answered")
    if (status.length === 0) return "unanswered"
    return status.join(" ")
  }

  // Function to parse question text
  const parseQuestionText = (text) => {
    if (!text) return { passage: '', question: '' }; // Handle undefined text
    const parts = text.split(/<br\s*\/?>/i); // Split by <br> tag
    const passage = parts[0]; // Everything before the <br>
    const question = parts[1] ? parts[1] : ''; // Everything after the <br>, or empty if not present
    return { passage, question };
  };

  const handleSubmitClick = () => {
    setShowSubmitModal(true);
  };

  const handleSubmitTest = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        return;
      }

      console.log('Submitting test with data:', {
        user_id: user.id,
        test_id: testId,
        name: testName,
        answers: answers
      });

      const response = await fetch('/api/submit-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          test_id: testId,
          name: testName,
          answers: answers
        }),
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (!response.ok) {
        console.error('Failed to submit test:', data.error);
        return;
      }

      // Set the test results using the detailed response
      const { testSummary } = data;
      console.log('Test Summary:', testSummary);

      const results = {
        score: testSummary.score,
        totalQuestions: questions.length,
        correctAnswers: testSummary.correctAnswers,
        incorrectAnswers: testSummary.incorrectAnswers,
        testName: testSummary.testName,
        answers: testSummary.answers
      };

      console.log('Formatted Results:', results);
      setTestResults(results);
      setShowResultsModal(true);

    } catch (error) {
      console.error('Error submitting test:', error);
    }
  };

  // Format time display function
  const formatTimeDisplay = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours > 0 ? `${hours}:` : ''}${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Add a pause timer function (optional feature)
  const pauseTimer = () => {
    // Implementation for pausing timer if needed
    // This would require additional state management
  };

  return (
    <div className="test-container">
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <TopBar title="Full Length Practice Test" />
          
          <div className="main-content">
            <div className="content-card">
              {/* Parse the question text */}
              {(() => {
                const { passage, question } = parseQuestionText(questions[currentQuestion - 1]?.question_text);
                return (
                  <>
                    {hasMath(passage) ? (
                      <div
                        className="passage question-text-container"
                        dangerouslySetInnerHTML={{ __html: renderMathFromModule(passage) }}
                      />
                    ) : (
                      <p className="passage">{passage}</p>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="content-card">
              <div className="question-header">
                <div className="question-number">{currentQuestion}</div>
                <button
                  onClick={() => toggleFlagged(currentQuestion)}
                  className={`bookmark-button ${flaggedQuestions.has(currentQuestion) ? "flagged" : ""}`}
                >
                  <Bookmark className="w-5 h-5" fill={flaggedQuestions.has(currentQuestion) ? "currentColor" : "none"} />
                </button>
              </div>
              {(() => {
                const { passage, question } = parseQuestionText(questions[currentQuestion - 1]?.question_text);
                return (
                  <>
                    {hasMath(question) ? (
                      <div
                        className="question-text question-text-container"
                        dangerouslySetInnerHTML={{ __html: renderMathFromModule(question) }}
                      />
                    ) : (
                      <p className="question-text">{question}</p>
                    )}
                  </>
                );
              })()}
              <div className="choices">
                {questions[currentQuestion - 1]?.options.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => handleAnswer(currentQuestion, choice.id)}
                    className={`choice-button ${answers[currentQuestion] === choice.id ? "selected" : ""}`}
                  >
                    <span className="choice-letter">{choice.value}.</span>
                    {hasMath(choice.text || choice.label) ? (
                      <span
                        className="option-text"
                        dangerouslySetInnerHTML={{ __html: renderMathFromModule(choice.text || choice.label) }}
                      />
                    ) : (
                      <span className="option-text">{choice.text || choice.label}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {showQuestionNav && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h2 className="modal-title">Questions</h2>
                  <button onClick={() => setShowQuestionNav(false)} className="modal-close">
                    ×
                  </button>
                </div>

                <div className="question-status-legend">
                  <div className="status-item">
                    <div className="status-indicator status-current" />
                    Current
                  </div>
                  <div className="status-item">
                    <div className="status-indicator status-unanswered" />
                    Unanswered
                  </div>
                  <div className="status-item">
                  <div className="status-indicator status-flagged" />
                  For Review
                  </div>
                </div>

                <div className="question-grid">
                  {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      onClick={() => {
                        setCurrentQuestion(num)
                        setShowQuestionNav(false)
                      }}
                      className={`grid-button ${getQuestionStatus(num)}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <button onClick={handleSubmitClick} className="review-button">
                  Submit Test
                </button>
              </div>
            </div>
          )}

          {showSubmitModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <div className="modal-header">
                  <h2 className="modal-title">Submit Test</h2>
                  <button onClick={() => setShowSubmitModal(false)} className="modal-close">
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to submit this test?</p>
                  <p>You won't be able to change your answers after submission.</p>
                  
                  <div className="modal-actions">
                    <button 
                      onClick={() => setShowSubmitModal(false)} 
                      className="cancel-button"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        setShowSubmitModal(false);
                        handleSubmitTest();
                      }} 
                      className="submit-button"
                    >
                      Submit Test
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showResultsModal && (
            <div className="modal-overlay">
              <div className="modal-content results-modal">
                <div className="modal-header">
                  <h2 className="modal-title">Test Results</h2>
                </div>
                <div className="modal-body">
                  <div className="results-summary">
                    <h3>{testResults.testName}</h3>
                    <div className="score-circle">
                      <span className="score-number">{testResults.score}</span>
                      <span className="score-total">/{testResults.totalQuestions}</span>
                    </div>
                    <div className="score-details">
                      <p>Correct Answers: {testResults.correctAnswers}</p>
                      <p>Incorrect Answers: {testResults.incorrectAnswers}</p>
                    </div>
                  </div>
                  
                  <div className="next-steps">
                    <h4>What's Next?</h4>
                    <div className="action-buttons">
                      <button 
                        onClick={() => router.push('/review-test?testId=' + testId)} 
                        className="review-answers-button"
                      >
                        Review Answers
                      </button>
                      <button 
                        onClick={() => router.push('/TimedTestDash')} 
                        className="back-to-dashboard"
                      >
                        Back to Dashboard
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bottom-nav">
            <div className="bottom-nav-content">
              <div className="question-info">
                <span className="question-count">
                  Question {currentQuestion} of {totalQuestions}
                </span>
                <button onClick={() => setShowQuestionNav(true)} className="view-all-button">
                  View All Questions
                </button>
              </div>
              <div className="nav-buttons">
                {/* Enhanced timer in bottom nav */}
                <div className={`bottom-timer ${timeRemaining < 300 ? 'timer-warning' : ''}`}>
                  <Clock className="timer-icon" size={16} />
                  <span className="timer-text">{formatTimeDisplay(timeRemaining)}</span>
                </div>
                <button
                  onClick={() => setCurrentQuestion((prev) => Math.max(1, prev - 1))}
                  disabled={currentQuestion === 1}
                  className="nav-button"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentQuestion((prev) => Math.min(totalQuestions, prev + 1))}
                  disabled={currentQuestion === totalQuestions}
                  className="nav-button"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button onClick={handleSubmitClick} className="review-button">
                  Submit Test
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Main page component with Suspense boundary
export default function TestMode() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">
      <div className="text-xl font-semibold">Loading test...</div>
    </div>}>
      <TestModeContent />
    </Suspense>
  );
}

export const dynamic = 'force-dynamic';

