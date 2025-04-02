"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { Bookmark, ChevronLeft, ChevronRight, Eye, MoreVertical, Flag, MessageCircle, Clock } from "lucide-react"
import { formatTime } from "../lib/utils"
import TopBar from "../components/TopBar"
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { processMathInText, renderMathString, processTableFormat } from '../components/MathRenderer'
import 'katex/dist/katex.min.css'
import MarkdownIt from 'markdown-it'
import markdownItKatex from 'markdown-it-katex'
import katex from 'katex'

// Create a client component that uses useSearchParams
function PracticeTestContent() {
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
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef(null)
  const loadedFromPausedTest = useRef(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const testId = searchParams.get('testId')
  const moduleId = searchParams.get('moduleId')
  
  const supabase = createClientComponentClient()
  
  const totalQuestions = questions.length
  
  // Define all callbacks at the top level 
  const handleQuestionNumberClick = useCallback((e) => {
    if (e) e.stopPropagation();
    const newValue = !showQuestionNav;
    console.log("Question number box clicked - changing navigation to:", newValue);
    setShowQuestionNav(newValue);
  }, [showQuestionNav]);
  
  const toggleFlagged = useCallback((questionId) => {
    if (!questionId) return;
    setFlaggedQuestions(prev => {
      const newFlagged = new Set(prev);
      if (newFlagged.has(questionId)) {
        newFlagged.delete(questionId);
      } else {
        newFlagged.add(questionId);
      }
      return newFlagged;
    });
  }, []);

  const navigateQuestion = useCallback((direction) => {
    // If on the last question and trying to go to next question, 
    // open the submit modal instead of redirecting
    if (direction > 0 && currentQuestion === totalQuestions - 1) {
      // Show the submit modal for review
      setShowSubmitModal(true);
      // Pause timer
      clearInterval(timerRef.current);
      return;
    }
    
    // Normal navigation between questions
    setCurrentQuestion(prev => {
      const next = prev + direction;
      return Math.max(0, Math.min(totalQuestions - 1, next));
    });
  }, [totalQuestions, currentQuestion, timerRef]);

  const handleAnswer = useCallback((questionId, optionId, isCorrect) => {
    if (!questionId) return;
    setAnswers(prev => ({
      ...prev,
      [questionId]: { optionId, isCorrect }
    }));
  }, []);
  
  const getQuestionStatus = useCallback((index) => {
    const question = questions[index];
    if (!question) return 'unanswered';
    
    const answered = answers[question.id] !== undefined;
    const flagged = flaggedQuestions.has(question.id);
    
    if (answered && flagged) return 'answered-flagged';
    if (answered) return 'answered';
    if (flagged) return 'flagged';
    return 'unanswered';
  }, [questions, answers, flaggedQuestions]);

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
        
        // Check if this is Module 2
        const isModule2 = data.moduleInfo && data.moduleInfo.moduleNumber === 2
        
        // Only reset these states if we're not loading from a paused test, or if this is Module 2
        if (!loadedFromPausedTest.current || isModule2) {
          setCurrentQuestion(0)
          setAnswers({})
          setFlaggedQuestions(new Set())
          
          // Set time limit based on subject
          const subjectId = data.moduleInfo.subjectId
          setTimeRemaining(subjectId === 1 ? 35 * 60 : 32 * 60) // 35 min for Math, 32 min for Reading & Writing
        }
        
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
  
  const handleSubmitClick = () => {
    // Only open submit modal if at least one question in the current module is answered
    const currentModuleAnsweredCount = questions.filter(q => answers[q.id] !== undefined).length;
    if (currentModuleAnsweredCount > 0) {
      setShowSubmitModal(true)
      // Pause timer
      clearInterval(timerRef.current)
    }
  }
  
  const handleSubmitModule = async () => {
    setShowSubmitModal(false)
    setIsLoading(true)
    
    try {
      // Format answers for submission - only include answers for the current module
      const currentModuleAnswers = {};
      questions.forEach(q => {
        if (answers[q.id]) {
          currentModuleAnswers[q.id] = answers[q.id];
        }
      });

      const formattedAnswers = Object.entries(currentModuleAnswers).map(([questionId, data]) => ({
        questionId: parseInt(questionId),
        selectedOptionId: data.optionId,
        isCorrect: data.isCorrect
      }));
      
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
              // Clear loaded from paused test flag when going to Module 2
              if (data.nextModule.moduleNumber === 2) {
                loadedFromPausedTest.current = false
              }
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
  
  const handlePauseTest = async (destination = '/TimedTestDash') => {
    // Pause the timer
    clearInterval(timerRef.current)
    setIsPaused(true)
    
    try {
      // Save the current test state to the database
      const response = await fetch('/api/pause-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testId,
          moduleId,
          currentQuestion,
          timeRemaining,
          answers: Object.entries(answers).map(([questionId, data]) => ({
            questionId: parseInt(questionId),
            selectedOptionId: data.optionId,
            isCorrect: data.isCorrect
          })),
          flaggedQuestions: Array.from(flaggedQuestions)
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to save test progress')
      }
      
      // Redirect to destination (defaults to dashboard if not specified)
      router.push(destination)
    } catch (err) {
      console.error('Error pausing test:', err)
      // Resume the timer if there was an error
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
      setIsPaused(false)
      alert('Failed to save your progress. Please try again.')
    }
  }
  
  // Update the useEffect hook that checks for a paused test
  const checkForPausedTest = useCallback(async () => {
    if (!moduleId || !testId) return;
    
    try {
      const response = await fetch(`/api/paused-test?testId=${testId}&moduleId=${moduleId}`);
      
      if (!response.ok) {
        console.log('No paused test found or error occurred');
        return; // No paused test found or error occurred
      }
      
      const data = await response.json();
      console.log('Paused test data:', data);
      
      if (data.pausedTest) {
        // Set loading state immediately
        setIsLoading(true);
        
        // Mark that we're loading from a paused test to prevent timer reset
        loadedFromPausedTest.current = true;
        
        try {
          // Fetch questions first
          const questionsResponse = await fetch(`/api/practice-test-questions?moduleId=${moduleId}`);
          const questionsData = await questionsResponse.json();
          
          if (questionsResponse.ok) {
            // Set all state updates together to avoid inconsistent renders
            setQuestions(questionsData.questions);
            setModuleInfo(questionsData.moduleInfo);
            setCurrentQuestion(parseInt(data.pausedTest.current_question) || 0);
            setTimeRemaining(parseInt(data.pausedTest.time_remaining) || 3600);
            
            // Parse answers
            const parsedAnswers = {};
            if (data.pausedTest.answers && Array.isArray(data.pausedTest.answers)) {
              data.pausedTest.answers.forEach(answer => {
                if (answer && answer.questionId) {
                  parsedAnswers[answer.questionId] = {
                    optionId: answer.selectedOptionId,
                    isCorrect: answer.isCorrect
                  };
                }
              });
            }
            setAnswers(parsedAnswers);
            
            // Parse flagged questions - ensure they're numbers
            let flaggedArray = [];
            try {
              if (data.pausedTest.flaggedQuestions) {
                flaggedArray = Array.isArray(data.pausedTest.flaggedQuestions) 
                  ? data.pausedTest.flaggedQuestions 
                  : JSON.parse(data.pausedTest.flaggedQuestions);
              }
            } catch (e) {
              console.error('Error parsing flagged questions:', e);
              flaggedArray = [];
            }
            
            // Convert to numbers and create a Set
            const flaggedSet = new Set(flaggedArray.map(id => 
              typeof id === 'string' ? parseInt(id) : id
            ).filter(id => !isNaN(id)));
            
            setFlaggedQuestions(flaggedSet);
            
            console.log('Test state restored:', {
              currentQuestion: data.pausedTest.current_question,
              answers: parsedAnswers,
              flagged: Array.from(flaggedSet)
            });
          }
        } catch (err) {
          console.error('Error loading questions for paused test:', err);
          // Redirect to dashboard in case of error
          router.push('/TimedTestDash');
        } finally {
          setIsLoading(false);
        }
      }
    } catch (err) {
      console.error('Error checking for paused test:', err);
    }
  }, [testId, moduleId, router, loadedFromPausedTest]);

  // Use this function in the useEffect
  useEffect(() => {
    checkForPausedTest();
  }, [checkForPausedTest]);
  
  // Use an effect to handle auto-pausing when navigating away or closing the page
  useEffect(() => {
    // Event handlers for page visibility change and beforeunload
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && !testComplete) {
        console.log('Page hidden, auto-pausing test');
        handleAutoPause();
      } else if (document.visibilityState === 'visible' && !testComplete && timeRemaining > 0) {
        console.log('Page visible, resuming test');
        // Resume the timer if the test is not complete
        clearInterval(timerRef.current); // Clear any existing timer first
        timerRef.current = setInterval(() => {
          setTimeRemaining(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              handleSubmitModule();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    };
    
    const handleBeforeUnload = (event) => {
      if (!testComplete) {
        // Pause the test
        handleAutoPause();
        
        // Standard way to show a confirmation dialog
        event.preventDefault();
        event.returnValue = 'Your test progress will be automatically saved. Are you sure you want to leave?';
      }
    };
    
    // Handler function for auto-pausing
    const handleAutoPause = async () => {
      try {
        // Only pause if we're not already at the end of a test
        if (testComplete) return;
        
        // Pause the timer
        clearInterval(timerRef.current);
        
        // Save the current test state
        await fetch('/api/pause-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testId,
            moduleId,
            currentQuestion,
            timeRemaining,
            answers: Object.entries(answers).map(([questionId, data]) => ({
              questionId: parseInt(questionId),
              selectedOptionId: data.optionId,
              isCorrect: data.isCorrect
            })),
            flaggedQuestions: Array.from(flaggedQuestions)
          })
        });
        
        console.log('Test auto-paused successfully');
      } catch (error) {
        console.error('Error auto-pausing test:', error);
      }
    };
    
    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Clean up event listeners
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [testId, moduleId, currentQuestion, timeRemaining, answers, flaggedQuestions, testComplete]);

  // Handle navigation with App Router
  useEffect(() => {
    // Intercept navigation attempts with the router
    const handleNavigation = (e) => {
      if (!testComplete) {
        // Pause test when clicking any link
        const target = e.target.closest('a');
        if (target && !target.getAttribute('href')?.includes('/PracticeTestMode')) {
          console.log('Navigation link clicked, pausing test');
          
          // Get the intended destination
          const destination = target.getAttribute('href');
          
          // Prevent default navigation
          e.preventDefault();
          
          // Pause the test and redirect to the intended destination
          handlePauseTest(destination);
        }
      }
    };

    // Listen for click events on the document to catch all link clicks
    document.addEventListener('click', handleNavigation);

    return () => {
      document.removeEventListener('click', handleNavigation);
    };
  }, [testComplete, handlePauseTest]);
  
  // Move the debug logging to within useEffect hooks rather than at render time
  useEffect(() => {
    console.log("Current question:", currentQuestion); 
    console.log("Rendering question", currentQuestion + 1, "Math subject:", practiceTestInfo?.subjects?.subject_name === 'Math');
  }, [currentQuestion, practiceTestInfo]);
  
  // Initialize markdown renderer
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
  }).use(markdownItKatex);

  md.enable('table');

  // Helper function to determine if question is math
  const isMathQuestion = (question) => {
    return question && (
      question.subject_id === 1 || 
      practiceTestInfo?.subjects?.subject_name === 'Math'
    );
  };

  // Render Reading & Writing content with markdown-it
  const renderReadingContent = (content) => {
    if (!content) return '';
    
    // Process tables first
    content = processTableFormat(content);
    
    // Simple markdown rendering for reading content
    return md.render(content);
  };

  // This is specifically for rendering option text in Reading & Writing questions
  const renderOptionText = (optionText) => {
    if (!optionText) return '';
    
    // Always use markdown rendering for Reading & Writing options
    return renderReadingContent(optionText);
  };

  const renderResponse = (response, question) => {
    if (!response) return '';
    
    // Normalize underscores - replace more than 5 consecutive underscores with just 5
    response = response.replace(/_{6,}/g, '_____');
    
    // Different rendering for Math vs Reading & Writing
    if (isMathQuestion(question)) {
      return renderMathString(response);
    } else {
      return renderReadingContent(response);
    }
  };
  
  if (isLoading) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
      }}>
        <div style={styles.loadingContent}>
          <div style={styles.loadingSpinner}></div>
          <p style={{ 
            color: '#6b7280', 
            fontSize: '16px',
            fontFamily: '"Myriad Pro", Arial, sans-serif',
            marginTop: '1rem'
          }}>Loading test questions...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div style={styles.errorContainer}>
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
  
  console.log("Current question:", currentQuestion); 
  console.log("Showing question nav:", showQuestionNav);
  
  // Create the modal components inside the component function
  const renderScoreModal = () => (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        {testComplete ? (
          <>
            <h2 style={styles.modalTitle}>Test Complete!</h2>
            <div style={styles.scoreContainer}>
              <h3 style={styles.scoreLabel}>Your Score:</h3>
              <p style={styles.scoreValue}>
                {currentScore.correct} / {currentScore.total}
              </p>
              <p style={styles.scorePercent}>
                {Math.round((currentScore.correct / currentScore.total) * 100)}%
              </p>
              
              {overallScore && (
                <>
                  <h3 style={styles.scoreLabel}>Overall Test Score:</h3>
                  <p style={styles.scoreValue}>
                    {overallScore.correct} / {overallScore.total}
                  </p>
                  <p style={styles.scorePercent}>
                    {Math.round((overallScore.correct / overallScore.total) * 100)}%
                  </p>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <h2 style={styles.modalTitle}>Module Complete</h2>
            <p style={styles.modalMessage}>
              Proceeding to Module 2 in 5 seconds...
            </p>
          </>
        )}
        
        <button style={styles.modalButton} onClick={handleScoreModalClose}>
          {testComplete ? "Return to Dashboard" : "Continue Now"}
        </button>
      </div>
    </div>
  );

  const renderSubmitModal = () => (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h2 style={styles.modalTitle}>Submit Module?</h2>
        <p style={styles.modalText}>
          You have answered {
            // Only count answers for questions in the current module
            questions.filter(q => answers[q.id] !== undefined).length
          } of {totalQuestions} questions.
          Are you sure you want to submit?
        </p>
        
        <div style={styles.modalButtons}>
          <button style={styles.cancelButton} onClick={() => {
            setShowSubmitModal(false);
            // Resume timer
            if (!testComplete && timeRemaining > 0) {
              timerRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                  if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleSubmitModule();
                    return 0;
                  }
                  return prev - 1;
                });
              }, 1000);
            }
          }}>
            Cancel
          </button>
          <button style={styles.submitButton} onClick={handleSubmitModule}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
  
  return (
    <div style={styles.container}>
      {!isLoading && !error && currentQuestionData && (
        <>
          <div style={styles.testHeader}>
            <div style={styles.testInfo}>
              <h2 style={styles.testName}>
                {practiceTestInfo?.name} Module {moduleInfo?.moduleNumber}
              </h2>
            </div>
            
            <div style={styles.timerContainer}>
              <div style={styles.timer}>
                {formatTime(timeRemaining)}
              </div>
              <button 
                style={styles.pauseButton}
                onClick={() => handlePauseTest()}
              >
                Pause
              </button>
            </div>
          </div>
          
          <div style={styles.practiceTestBanner}>
            THIS IS A PRACTICE TEST
          </div>
        </>
      )}
      
      {isLoading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.loadingContent}>
            <div style={styles.loadingSpinner}></div>
            <p>Loading test questions...</p>
          </div>
        </div>
      ) : error ? (
        <div style={styles.errorContainer}>
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
      ) : !currentQuestionData ? (
        <div style={styles.errorContainer}>
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
      ) : (
        <>
          <div style={styles.mainContent}>
            <div style={styles.questionContainer}>
              {practiceTestInfo?.subjects?.subject_name !== 'Math' && (
                <div style={styles.markReviewTextOnly}>
                  <span 
                    style={styles.markReviewText}
                    onClick={(e) => {
                      if (currentQuestionData && currentQuestionData.id) {
                        toggleFlagged(currentQuestionData.id);
                      }
                    }}
                  >
                    <Bookmark size={14} style={{ color: flaggedQuestions.has(currentQuestionData.id) ? '#ef4444' : '#6b7280' }} />
                    Mark for Review
                  </span>
                </div>
              )}
              
              {practiceTestInfo?.subjects?.subject_name === 'Math' ? (
                <div style={styles.mathQuestion}>
                  <div style={styles.questionHeader}>
                    <div style={styles.questionNumberBox}>
                      {currentQuestion + 1}
                    </div>
                    <div style={styles.markReviewBox}>
                      <Bookmark size={14} style={{ color: flaggedQuestions.has(currentQuestionData.id) ? '#ef4444' : '#6b7280' }} />
                      <span onClick={() => toggleFlagged(currentQuestionData.id)}>Mark for Review</span>
                    </div>
                  </div>
                  
                  {/* Display image if available */}
                  {currentQuestionData.image_url && (
                    <div style={styles.imageContainer}>
                      <img 
                        src={currentQuestionData.image_url} 
                        alt="Question diagram" 
                        style={styles.questionImage}
                        onError={(e) => {
                          console.error('Failed to load image:', currentQuestionData.image_url);
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <div style={{ 
                    padding: '1rem 4rem', 
                    fontSize: '1rem', 
                    lineHeight: '1.5', 
                    maxWidth: '1000px', 
                    margin: '0 auto', 
                    fontFamily: '"Minion Pro", Times, serif' 
                  }}>
                    <div dangerouslySetInnerHTML={{ __html: currentQuestionData.question_text ? renderResponse(currentQuestionData.question_text, currentQuestionData) : 'Loading question...' }} className="question-text-container" />
                  </div>
                  
                  <div className="options-container" style={styles.optionsContainer}>
                    {currentQuestionData.options
                      .sort((a, b) => a.value.localeCompare(b.value)) // Sort options alphabetically (A, B, C, D)
                      .map(option => (
                      <div
                        key={option.id}
                        style={{
                          ...styles.optionCard,
                          ...(selectedOptionId === option.id ? styles.selectedOption : {})
                        }}
                        onClick={() => handleAnswer(currentQuestionData.id, option.id, option.isCorrect)}
                      >
                        <div style={styles.optionLetter}>{option.value}</div>
                        <div style={{ ...styles.optionText, fontFamily: '"Minion Pro", Times, serif' }}>
                          <div dangerouslySetInnerHTML={{ __html: option.label ? renderResponse(option.label, currentQuestionData) : 'Loading...' }} className="question-text-container" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={styles.rwSplitContainer}>
                  <div style={styles.rwQuestionContainer}>
                    <div style={styles.questionHeader}>
                      <span style={styles.questionNumberBox}>Question {currentQuestion + 1}</span>
                      <span 
                        style={styles.markReviewBox}
                        onClick={() => toggleFlagged(currentQuestionData.id)}
                      >
                        <Bookmark 
                          size={16} 
                          style={{ 
                            width: '16px', 
                            height: '16px',
                            color: flaggedQuestions.has(currentQuestionData.id) ? '#ef4444' : '#6b7280' 
                          }} 
                        />
                        <span>Mark for Review</span>
                      </span>
                    </div>
                    
                    {/* Display image if available */}
                    {currentQuestionData.image_url && (
                      <div style={styles.imageContainer}>
                        <img 
                          src={currentQuestionData.image_url} 
                          alt="Question diagram" 
                          style={styles.questionImage}
                          onError={(e) => {
                            console.error('Failed to load image:', currentQuestionData.image_url);
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    <div style={{ 
                      padding: '1rem', 
                      fontSize: '1rem', 
                      lineHeight: '1.6',
                      fontFamily: '"Minion Pro", Times, serif',
                      color: '#1f2937',
                      marginBottom: '1.5rem',
                      overflowWrap: 'break-word',
                      wordWrap: 'break-word',
                      wordBreak: 'break-word',
                      hyphens: 'auto',
                      whiteSpace: 'pre-wrap',
                      maxWidth: '100%'
                    }}>
                      <div dangerouslySetInnerHTML={{ __html: currentQuestionData.question_text ? renderResponse(currentQuestionData.question_text, currentQuestionData) : 'Loading question...' }} className="question-text-container" />
                    </div>
                  </div>
                  
                  <div style={styles.rwOptionsContainer} className="rwOptionsContainer">
                    {currentQuestionData.options
                      .sort((a, b) => a.value.localeCompare(b.value)) // Sort options alphabetically (A, B, C, D)
                      .map(option => (
                      <div
                        key={option.id}
                        style={{
                          ...styles.rwOptionCard,
                          ...(selectedOptionId === option.id ? styles.rwSelectedOption : {})
                        }}
                        onClick={() => handleAnswer(currentQuestionData.id, option.id, option.isCorrect)}
                      >
                        <div style={styles.rwOptionLetter}>{option.value}</div>
                        <div style={{ 
                          ...styles.rwOptionText, 
                          fontFamily: '"Minion Pro", Times, serif',
                          color: '#1f2937',
                          fontSize: '1rem',
                          lineHeight: '1.5',
                          overflowWrap: 'break-word',
                          wordWrap: 'break-word',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                          width: '100%'
                        }}>
                          <div dangerouslySetInnerHTML={{ __html: option.label ? renderOptionText(option.label) : 'Loading...' }} className="question-text-container" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div style={styles.navigationFooter}>
            <div style={styles.bottomQuestionBox} onClick={handleQuestionNumberClick}>
              <span style={{ marginRight: '16px' }}>Question {currentQuestion + 1} of {totalQuestions}</span>
              <div style={styles.upArrow}>▲</div>
              {flaggedQuestions.has(currentQuestionData?.id) && (
                <div style={styles.bottomBookmarkIcon}>
                  <Bookmark size={12} />
                </div>
              )}
            </div>
            {currentQuestion > 0 && (
              <button 
                style={styles.backButton}
                onClick={() => navigateQuestion(-1)}
              >
                Back
              </button>
            )}
            <button
              style={styles.nextButton}
              onClick={() => navigateQuestion(1)}
            >
              {currentQuestion < totalQuestions - 1 ? 'Next' : 'Go to Review'}
            </button>
          </div>
        </>
      )}
      
      {showQuestionNav && (
        <div style={styles.questionNavOverlay} onClick={() => setShowQuestionNav(false)}>
          <div style={styles.questionNavContainer} onClick={(e) => e.stopPropagation()}>
            <div style={styles.questionNavHeader}>
              <h2 style={styles.questionNavTitle}>
                {practiceTestInfo?.name} Module {moduleInfo?.moduleNumber} Questions
              </h2>
              <button style={styles.closeButton} onClick={() => setShowQuestionNav(false)}>×</button>
            </div>
            
            <div style={styles.questionNavTabs}>
              <div style={styles.tabLegend}>
                <span style={styles.legendDot}>●</span> Current
              </div>
              <div style={styles.tabLegend}>
                <span style={styles.legendBox}></span> Unanswered
              </div>
              <div style={styles.tabLegend}>
                <span><Bookmark size={12} /></span> For Review
              </div>
            </div>
            
            <div style={styles.questionGrid}>
              {questions.map((q, index) => {
                const status = getQuestionStatus(index);
                return (
                  <div
                    key={index}
                    style={{
                      ...styles.questionButton,
                      ...(index === currentQuestion ? styles.currentQuestion : {}),
                      ...(status === 'answered' ? styles.answeredQuestion : {}),
                      ...(status === 'flagged' ? styles.flaggedQuestion : {}),
                      ...(status === 'answered-flagged' ? styles.answeredFlaggedQuestion : {})
                    }}
                    onClick={() => {
                      setCurrentQuestion(index);
                      setShowQuestionNav(false);
                    }}
                  >
                    {index + 1}
                    {index === currentQuestion && (
                      <span style={styles.currentLocationIcon}>●</span>
                    )}
                    {(status === 'flagged' || status === 'answered-flagged') && (
                      <div style={styles.flaggedBookmark}>
                        <Bookmark size={12} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div style={styles.questionNavFooter}>
              <button 
                style={{
                  padding: '0.6rem 1.2rem',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setShowQuestionNav(false);
                  // Show the submit modal instead of redirecting
                  setShowSubmitModal(true);
                  // Pause timer
                  clearInterval(timerRef.current);
                }}
              >
                Go to Review Page
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showSubmitModal && renderSubmitModal()}
      
      {showScoreModal && currentScore && renderScoreModal()}
    </div>
  )
}

// Main page component
export default function PracticeTestPage() {
  return (
    <Suspense fallback={<div className="w-full h-full flex items-center justify-center">Loading practice test...</div>}>
      <PracticeTestContent />
    </Suspense>
  );
}

// Add global styles for markdown rendering
const globalStyles = `
  .question-text-container table {
    border-collapse: collapse;
    width: 100%;
    margin: 16px 0;
    font-size: 16px;
  }
  
  .question-text-container th,
  .question-text-container td {
    border: 1px solid #e5e7eb;
    padding: 8px 12px;
    text-align: left;
  }
  
  .question-text-container th {
    background-color: #f9fafb;
    font-weight: 600;
  }
  
  .question-text-container tr:nth-child(even) {
    background-color: #f9fafb;
  }
  
  .question-text-container tr:hover {
    background-color: #f3f4f6;
  }

  /* Reading & Writing specific styles */
  .question-text-container p {
    margin: 0.75em 0;
  }
  
  .question-text-container ul, 
  .question-text-container ol {
    padding-left: 1.5rem;
    margin: 0.75em 0;
  }
  
  .question-text-container li {
    margin: 0.5em 0;
  }
  
  .question-text-container blockquote {
    margin: 1em 0;
    padding-left: 1rem;
    border-left: 4px solid #e5e7eb;
    color: #4b5563;
  }
  
  .question-text-container h1, 
  .question-text-container h2, 
  .question-text-container h3, 
  .question-text-container h4 {
    margin: 1.5em 0 0.5em;
    font-weight: 600;
  }
  
  /* Answer options styling for Reading & Writing */
  .rwOptionsContainer .question-text-container p:first-child {
    margin-top: 0;
  }
  
  .rwOptionsContainer .question-text-container p:last-child {
    margin-bottom: 0;
  }
  
  /* KaTeX styles */
  .katex-display {
    overflow-x: auto;
    overflow-y: hidden;
    padding: 0.5rem 0;
    max-width: 100%;
  }
  
  .katex {
    font-size: 1.1em;
  }
`;

if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = globalStyles;
  document.head.appendChild(styleElement);
}

const styles = {
  container: {
    width: '100%',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f9fafb',
    fontFamily: '"Myriad Pro", Arial, sans-serif',
  },
  testHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 1.5rem',
    backgroundColor: '#f0f2f5',
    borderBottom: '1px solid #e5e7eb',
  },
  testInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  testName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
    fontFamily: '"Myriad Pro", Arial, sans-serif',
  },
  timerContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  timer: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#111827',
    fontFamily: '"Myriad Pro", Arial, sans-serif',
  },
  pauseButton: {
    padding: '0.4rem 0.8rem',
    borderRadius: '4px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    color: '#1f2937',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: '"Myriad Pro", Arial, sans-serif',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '1rem',
    overflowY: 'auto',
    backgroundColor: '#f9fafb',
    minHeight: 0,
  },
  questionContainer: {
    backgroundColor: 'white',
    borderRadius: '0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: 'auto',
    overflow: 'auto',
    minHeight: 0,
  },
  markReviewTextOnly: {
    padding: '1rem 0 0 1rem',
    display: 'flex',
  },
  markReviewText: {
    fontSize: '14px',
    color: '#6b7280',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontFamily: '"Myriad Pro", Arial, sans-serif',
  },
  mathQuestion: {
    padding: '0 2rem 2rem 2rem',
    maxWidth: '1000px',
    margin: '0 auto',
    width: '100%',
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 180px)',
  },
  rwSplitContainer: {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    backgroundColor: 'white',
    height: 'auto',
    minHeight: 'calc(100vh - 180px)',
    maxHeight: 'calc(100vh - 180px)',
    gap: '0',
    padding: '1rem',
    overflow: 'hidden',
  },
  rwQuestionContainer: {
    width: '50%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
    borderRight: '1px solid #e5e7eb',
    paddingRight: '2rem',
    overflowY: 'auto',
    overflowWrap: 'break-word',
    wordWrap: 'break-word',
    wordBreak: 'break-word',
    hyphens: 'auto',
    maxHeight: '100%',
  },
  rwQuestion: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  optionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '1rem',
    maxWidth: '700px',
    margin: '1rem auto 0',
    padding: '0 1rem',
  },
  optionCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: 'white',
  },
  rwOptionsContainer: {
    width: '50%',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1rem',
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 180px)',
  },
  rwOptionCard: {
    display: 'flex',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    borderRadius: '0.25rem',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    alignItems: 'flex-start',
    wordBreak: 'break-word',
    width: '100%',
  },
  rwSelectedOption: {
    backgroundColor: '#eef2ff',
    border: '2px solid #4f46e5',
  },
  selectedOption: {
    border: '2px solid #4f46e5',
    backgroundColor: '#eef2ff',
  },
  optionLetter: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: '"Myriad Pro", Arial, sans-serif',
  },
  rwOptionLetter: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    fontSize: '14px',
    fontWeight: '500',
    fontFamily: '"Myriad Pro", Arial, sans-serif',
  },
  optionText: {
    flex: 1,
    fontSize: '15px',
    color: '#1f2937',
  },
  rwOptionText: {
    flex: 1,
    fontSize: '15px',
    color: '#1f2937',
    overflowWrap: 'break-word',
    wordWrap: 'break-word',
    wordBreak: 'break-word',
    minWidth: 0,
  },
  navigationFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    padding: '1rem',
    backgroundColor: 'white',
    borderTop: '1px solid #e5e7eb',
    gap: '0.5rem',
    position: 'relative',
    minHeight: '60px',
  },
  backButton: {
    padding: '0.5rem 1.5rem',
    borderRadius: '4px',
    border: '1px solid #d1d5db',
    backgroundColor: '#f3f4f6',
    color: '#1f2937',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: '"Myriad Pro", Arial, sans-serif',
  },
  nextButton: {
    padding: '0.5rem 1.5rem',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    fontFamily: '"Myriad Pro", Arial, sans-serif',
  },
  questionNavOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  questionNavContainer: {
    width: '80%',
    maxWidth: '500px',
    backgroundColor: 'white',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 2000,
  },
  questionNavHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.8rem 1rem',
    borderBottom: '1px solid #e5e7eb',
  },
  questionNavTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
    fontFamily: '"Myriad Pro", Arial, sans-serif',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
  },
  questionNavTabs: {
    display: 'flex',
    borderBottom: '1px solid #e5e7eb',
  },
  tabLegend: {
    padding: '0.75rem 1rem',
    color: '#6b7280',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    userSelect: 'none',
    fontFamily: '"Myriad Pro", Arial, sans-serif',
  },
  legendDot: {
    color: '#4b5563',
    fontSize: '14px',
  },
  legendBox: {
    width: '14px',
    height: '14px',
    border: '1px dashed #d1d5db',
    display: 'inline-block',
  },
  questionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(10, 1fr)',
    gap: '10px 8px',
    padding: '1rem',
    maxHeight: '280px',
    overflowY: 'auto',
    justifyItems: 'center',
  },
  questionButton: {
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px dashed #d1d5db',
    borderRadius: '2px',
    cursor: 'pointer',
    position: 'relative',
    fontSize: '14px',
    fontWeight: '400',
    color: '#4b5563',
    backgroundColor: 'white',
    margin: '0',
  },
  currentQuestion: {
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
    position: 'relative',
  },
  currentLocationIcon: {
    position: 'absolute',
    top: '-12px', 
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: 1,
  },
  answeredQuestion: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
  },
  flaggedQuestion: {
    border: '1px solid #ef4444',
    position: 'relative',
  },
  flaggedBookmark: {
    position: 'absolute',
    top: '-8px',
    right: '-4px',
    color: '#ef4444',
    fontSize: '12px',
  },
  answeredFlaggedQuestion: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: '2px solid #ef4444',
  },
  questionNavFooter: {
    padding: '1rem',
    display: 'flex',
    justifyContent: 'center',
    borderTop: '1px solid #e5e7eb',
  },
  loadingContainer: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f4f6',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorContainer: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    textAlign: 'center',
    maxWidth: '500px',
    padding: '2rem',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '2rem',
    width: '90%',
    maxWidth: '500px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: '600',
    marginTop: 0,
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  modalText: {
    fontSize: '16px',
    lineHeight: '1.5',
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    color: '#1f2937',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  submitButton: {
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
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  scoreLabel: {
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 0.5rem 0',
  },
  scoreValue: {
    fontSize: '32px',
    fontWeight: '700',
    margin: '0 0 0.25rem 0',
  },
  scorePercent: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#4f46e5',
    margin: 0,
  },
  modalMessage: {
    fontSize: '16px',
    marginBottom: '1.5rem',
    textAlign: 'center',
    color: '#6b7280',
  },
  modalButton: {
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#4f46e5',
    color: 'white',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    width: '100%',
  },
  practiceTestBanner: {
    padding: '0.75rem',
    backgroundColor: '#0f172a',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
    fontFamily: '"Myriad Pro", Arial, sans-serif',
  },
  bottomQuestionBox: {
    padding: '0.5rem 1.5rem',
    width: '180px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'black',
    color: 'white',
    fontWeight: 'normal',
    fontSize: '14px',
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    bottom: '0.95rem',
    cursor: 'pointer',
    borderRadius: '4px',
    zIndex: 10,
    fontFamily: '"Myriad Pro", Arial, sans-serif',
  },
  upArrow: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#fff',
    fontSize: '10px',
    display: 'flex',
    alignItems: 'center',
  },
  bottomBookmarkIcon: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    color: '#ef4444',
  },
  // Global styles for animations
  '@global': {
    '@keyframes spin': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
  },
  questionNumber: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 1rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    marginBottom: '1rem',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1f2937',
    fontFamily: '"Myriad Pro", Arial, sans-serif',
  },
  questionHeader: {
    width: '100%',
    marginBottom: '1.5rem',
  },
  questionNumberBox: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'black',
    color: 'white',
    padding: '0.5rem 1rem',
    fontSize: '1rem',
    fontWeight: '500',
    fontFamily: '"Myriad Pro", Arial, sans-serif',
  },
  markReviewBox: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#f3f4f6',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    color: '#6b7280',
    fontSize: '0.875rem',
    fontFamily: '"Myriad Pro", Arial, sans-serif',
    marginLeft: '1px',
  },
  imageContainer: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    padding: '1rem 0',
    margin: '0 auto 1rem auto',
    maxWidth: '800px',
  },
  questionImage: {
    maxWidth: '100%',
    maxHeight: '400px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  reviewQuestionList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '0.75rem',
    padding: '1rem',
    maxHeight: '300px',
    overflowY: 'auto',
  },
  reviewQuestionItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    border: '1px solid #e5e7eb',
    transition: 'all 0.2s ease',
  },
  reviewQuestionNumber: {
    minWidth: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    fontSize: '14px',
    fontWeight: '600',
    marginRight: '8px',
  },
  reviewQuestionStatus: {
    flex: 1,
    fontSize: '15px',
    color: '#1f2937',
  },
} 