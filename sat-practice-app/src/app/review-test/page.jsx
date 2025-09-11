"use client"

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import TopBar from '../components/TopBar'
import ChatSidebar from '../components/ChatSidebar'
import './review.css'
import { MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { processMathInText, renderMathContent as renderMathFromModule, processTableFormat, processWithKaTeX } from '../components/MathRenderer'
import MarkdownIt from 'markdown-it'
import markdownItKatex from 'markdown-it-katex'
import katex from 'katex'
import 'katex/dist/katex.min.css'

// Create a client component for content
function ReviewTestContent() {
  const [questions, setQuestions] = useState([])
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const testId = searchParams.get('testId')
  const [currentPage, setCurrentPage] = useState(1)
  const questionsPerPage = 24

  // Create the Supabase client
  const supabase = createClientComponentClient()

  // Calculate pagination indexes
  const indexOfLastQuestion = currentPage * questionsPerPage
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage
  const totalPages = Math.ceil(questions.length / questionsPerPage)

  // Pagination controls
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  // Set up the Markdown renderer with KaTeX support
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
    listIndent: 2  // Proper indentation for lists
  }).use(markdownItKatex);

  // Helper function to determine if question is math
  const isMathQuestion = (question) => {
    return question && (question.subjectId === 1 || question.subject_id === 1); // Math questions have subject_id of 1
  };

  // Simplified rendering for math questions
  const renderMathContent = (content) => {
    if (!content) return '';
    
    try {
      // Use the imported renderMathContent from MathRenderer
      return renderMathFromModule(content);
    } catch (error) {
      console.error('Error rendering math content:', error);
      // Fallback to regular markdown rendering if our processing fails
      return md.render(content);
    }
  };

  // Simplified rendering for reading/writing questions
  const renderReadingContent = (content) => {
    if (!content) return '';
    
    // Process tables first
    content = processTableFormat(content);
    
    // Simple markdown rendering for reading content
    return md.render(content);
  };

  // Unified rendering method that chooses the right renderer based on question type
  const renderResponse = (response, question) => {
    if (!response) return '';
    
    // Normalize underscores - replace more than 5 consecutive underscores with just 5
    response = response.replace(/_{6,}/g, '_____');
    
    if (question && isMathQuestion(question)) {
      // Use the imported renderMathContent from MathRenderer for math questions
      return renderMathFromModule(response);
    } else {
      // For reading/writing questions, use markdown rendering
      return renderReadingContent(response);
    }
  };

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
        
        const responseData = await questionsResponse.json()
        
        // Check if the response contains an error message but with empty data
        if (responseData.error && responseData.data && responseData.data.length === 0) {
          setQuestions([])
          setMetrics({
            accuracy: 0,
            correctAnswers: 0,
            incorrectAnswers: 0,
            totalQuestions: 0,
            topicPerformance: {}
          })
          setError(responseData.error)
          setLoading(false)
          return
        }
        
        const questionsData = responseData.data || responseData
        
        // Sort questions by module number and question ID to ensure order
        questionsData.sort((a, b) => {
          if (a.moduleNumber !== b.moduleNumber) {
            return a.moduleNumber - b.moduleNumber;
          }
          return a.id - b.id;
        });
        
        // Recalculate question numbers to be sequential: 1-22 for module 1, 23-44 for module 2
        const moduleQuestionsCount = {}; // Track question count per module
        
        questionsData.forEach((question, index) => {
          // Initialize counter for this module if not exists
          if (!moduleQuestionsCount[question.moduleNumber]) {
            moduleQuestionsCount[question.moduleNumber] = 0;
          }
          
          // Calculate proper display number based on module and previous questions
          moduleQuestionsCount[question.moduleNumber]++;
          
          // Store display number in the question object
          if (question.moduleNumber === 1) {
            question.displayNumber = moduleQuestionsCount[question.moduleNumber];
          } else {
            // For module 2, start from the total count of module 1 questions + 1
            const module1Count = moduleQuestionsCount[1] || 0;
            question.displayNumber = module1Count + moduleQuestionsCount[question.moduleNumber];
          }
        });
        
        // Calculate metrics
        const totalQuestions = questionsData.length
        const correctAnswers = questionsData.filter(q => q.userAnswer?.isCorrect).length
        const incorrectAnswers = totalQuestions - correctAnswers
        const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0

        // Group questions by domain/skill area
        const topicPerformance = questionsData.reduce((acc, question) => {
          // Use the domain name from the API response
          const topic = question.domainName || 'Unknown'
          
          if (!acc[topic]) {
            acc[topic] = { total: 0, correct: 0 }
          }
          
          acc[topic].total++
          if (question.userAnswer?.isCorrect) acc[topic].correct++
          
          return acc
        }, {})

        setMetrics({
          accuracy,
          correctAnswers,
          incorrectAnswers,
          totalQuestions,
          topicPerformance
        })

        setQuestions(questionsData)
        setCurrentPage(1)
        setSelectedQuestion(0)
        setLoading(false)

      } catch (error) {
        console.error('Error fetching test data:', error)
        setError('Failed to load test data: ' + (error.message || 'Unknown error'))
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
    
    // First check if there's a <br> tag
    if (text.includes('<br>') || text.includes('<br/>') || text.includes('<br />')) {
      const parts = text.split(/<br\s*\/?>/i);
      if (parts.length > 1) {
        return { passage: parts[0], question: parts.slice(1).join(' ') };
      }
    }
    
    // If no br tag or only one part, just return the whole text as question
    return { passage: '', question: text };
  };

  // Remove non-default KaTeX overrides to stick with library defaults

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '5px solid #e2e8f0',
            borderTopColor: '#4f46e5',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <div style={{
            fontSize: '1.2rem',
            color: '#6b7280',
            fontFamily: '"Myriad Pro", Arial, sans-serif'
          }}>
            Loading test data...
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="review-container">
        <TopBar title="Test Review" />
        <div className="review-content" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 'calc(100vh - 60px)' // Subtracting header height
        }}>
          <div className="error-state" style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.5rem',
              padding: '2.5rem',
              borderRadius: '0.75rem',
              backgroundColor: '#f8f9fa',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
              maxWidth: '600px',
              width: '90%',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#4b5563'
              }}>
                No Test Data Available
              </div>
              <div style={{
                fontSize: '1rem',
                color: '#6b7280',
                marginBottom: '1rem'
              }}>
                {error}
              </div>
              <button
                onClick={() => router.push('/TimedTestDash')}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  borderRadius: '0.375rem',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4338ca'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
              >
                Return to Tests
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="review-container">
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
                <p>Correct: <span className="correct-count">{metrics?.correctAnswers}</span></p>
                <p>Incorrect: <span className="incorrect-count">{metrics?.incorrectAnswers}</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="questions-and-content">
          <div className="questions-section">
            <h2>Questions</h2>
            <div className="questions-grid">
              {questions.slice(indexOfFirstQuestion, indexOfLastQuestion).map((question, index) => {
                const questionNumber = question.displayNumber;
                const hasUserAnswer = !!question.userAnswer;
                const isCorrect = question.userAnswer?.isCorrect;
                
                return (
                  <button
                    key={question.id}
                    className={`question-button ${selectedQuestion === indexOfFirstQuestion + index ? 'selected' : ''} 
                      ${isCorrect ? 'correct' : hasUserAnswer ? 'incorrect' : ''}`}
                    onClick={() => setSelectedQuestion(indexOfFirstQuestion + index)}
                  >
                    {questionNumber}
                  </button>
                );
              })}
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
                <div className="question-number">{questions[selectedQuestion].displayNumber}</div>
                <div className="question-topic">
                  {questions[selectedQuestion].domainName} - {questions[selectedQuestion].subcategoryName}
                  {questions[selectedQuestion].moduleNumber === 2 && (
                    <span className="module-tag">
                      {questions[selectedQuestion].isHarderModule ? 'Higher Difficulty' : 'Lower Difficulty'}
                    </span>
                  )}
                </div>
              </div>
              {(() => {
                const question = questions[selectedQuestion];
                
                try {
                  const parsedContent = parseQuestionText(question.text);
                  const passage = parsedContent.passage;
                  const questionText = parsedContent.question || question.text;
                  
                  return (
                    <>
                      {/* Display image first if available */}
                      {question.imageUrl && (
                        <div className="question-image-container">
                          <img 
                            src={question.imageUrl} 
                            alt="Question diagram" 
                            className="question-image"
                            onError={(e) => {
                              console.error('Failed to load image:', question.imageUrl);
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      {passage && passage.trim() !== '' && (
                        <div 
                          className="passage"
                          dangerouslySetInnerHTML={{ __html: renderResponse(passage, question) }}
                        />
                      )}
                      <div 
                        className="question-text"
                        dangerouslySetInnerHTML={{ __html: renderResponse(questionText, question) }}
                      />
                    </>
                  );
                } catch (err) {
                  console.error("Error rendering question:", err);
                  // Fallback display
                  return (
                    <div className="question-text">
                      {question.text}
                    </div>
                  );
                }
              })()}
              <div className="choices">
                {[...questions[selectedQuestion].options]
                  .sort((a, b) => {
                    // Sort by option value (A, B, C, D)
                    return a.value.localeCompare(b.value);
                  })
                  .map((option) => {
                    const isSelected = questions[selectedQuestion].userAnswer?.selectedOptionId === option.id;
                    const isCorrectOption = option.isCorrect;
                    
                    let choiceClass = 'choice-button';
                    if (isCorrectOption) {
                      choiceClass += ' correct-option';
                    } else if (isSelected) {
                      choiceClass += ' incorrect-option';
                    }
                    if (isSelected) {
                      choiceClass += ' selected-option';
                    }
                    
                    return (
                      <div
                        key={option.id}
                        className={choiceClass}
                      >
                        <span className="choice-letter">{option.value}</span>
                        <div 
                          className="option-text"
                          dangerouslySetInnerHTML={{ __html: isMathQuestion(questions[selectedQuestion]) 
                            ? renderMathFromModule(option.text)
                            : renderReadingContent(option.text) }}
                        />
                      </div>
                    );
                  })}
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
        questionText={selectedQuestion !== null ? questions[selectedQuestion].text : ''}
        selectedAnswer={selectedQuestion !== null ? questions[selectedQuestion].userAnswer?.selectedOptionId : ''}
        options={selectedQuestion !== null ? questions[selectedQuestion].options : []}
        imageURL={selectedQuestion !== null ? questions[selectedQuestion].imageUrl : ''}
        questionId={selectedQuestion !== null ? questions[selectedQuestion].id : null}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '41%',
          height: '100vh',
          zIndex: 50
        }}
      />
    </div>
  )
}

// Main component with Suspense boundary
export default function ReviewTestPage() {
  return (
    <Suspense fallback={
      <div className="review-container">
        <TopBar title="Test Review" />
        <div className="loading-state" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '70vh',
          fontSize: '18px',
          color: '#4b5563'
        }}>
          Loading test review data...
        </div>
      </div>
    }>
      <ReviewTestContent />
    </Suspense>
  );
} 