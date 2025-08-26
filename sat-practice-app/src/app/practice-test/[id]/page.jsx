'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '../../components/TopBar';
import { ChevronLeft, ChevronRight, Clock, Flag, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import 'katex/dist/katex.min.css';
import { renderMathContent as renderMathFromModule } from '../../components/MathRenderer';

export default function PracticeTestPage({ params }) {
  const testId = params.id;
  const router = useRouter();
  
  // Test state
  const [testName, setTestName] = useState('');
  const [subject, setSubject] = useState(null);
  const [currentModule, setCurrentModule] = useState(1);
  const [isHarderModule2, setIsHarderModule2] = useState(null); // Determined after Module 1
  
  // Module 1 state
  const [module1Questions, setModule1Questions] = useState([]);
  const [module1Answers, setModule1Answers] = useState({});
  const [module1Score, setModule1Score] = useState(0);
  const [module1Completed, setModule1Completed] = useState(false);
  
  // Module 2 state
  const [module2Questions, setModule2Questions] = useState([]);
  const [module2Answers, setModule2Answers] = useState({});
  const [module2Score, setModule2Score] = useState(0);
  const [module2Completed, setModule2Completed] = useState(false);
  
  // Question navigation
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  
  // Timer
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [showTimerWarning, setShowTimerWarning] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(true);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [testResults, setTestResults] = useState(null);

  const hasMath = (content) => typeof content === 'string' && /\$/.test(content);
  
  // Initialize test data
  useEffect(() => {
    const fetchTestData = async () => {
      try {
        setLoading(true);
        
        // Fetch test details
        const response = await fetch(`/api/practice-tests?practice_test_id=${testId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch test details');
        }
        
        const tests = await response.json();
        if (!tests || tests.length === 0) {
          throw new Error('Test not found');
        }
        
        const testData = tests[0];
        setTestName(testData.name);
        setSubject(testData.subjects?.subject_name || '');
        
        // Set initial timer based on subject
        const initialTime = testData.subjects?.subject_name?.includes('Math')
          ? 35 * 60  // 35 minutes in seconds for Math
          : 32 * 60; // 32 minutes in seconds for Reading & Writing
        
        setTimeRemaining(initialTime);
        
        // Fetch Module 1 questions
        await fetchModuleQuestions(1);
      } catch (err) {
        console.error('Error initializing test:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTestData();
  }, [testId]);
  
  // Timer effect
  useEffect(() => {
    if (!loading && timeRemaining !== null && !module1Completed && currentModule === 1) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === 300) { // 5 minutes warning
            setShowTimerWarning(true);
          }
          
          if (prev <= 1) {
            clearInterval(timer);
            handleModuleComplete();
            return 0;
          }
          
          return prev > 0 ? prev - 1 : 0;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
    
    if (!loading && timeRemaining !== null && !module2Completed && currentModule === 2) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === 300) { // 5 minutes warning
            setShowTimerWarning(true);
          }
          
          if (prev <= 1) {
            clearInterval(timer);
            handleModuleComplete();
            return 0;
          }
          
          return prev > 0 ? prev - 1 : 0;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [loading, timeRemaining, currentModule, module1Completed, module2Completed]);
  
  // Show timer warning alert
  useEffect(() => {
    if (showTimerWarning) {
      alert("5 minutes remaining!");
      setShowTimerWarning(false);
    }
  }, [showTimerWarning]);
  
  // Fetch questions for a specific module
  const fetchModuleQuestions = async (moduleNumber, isHarder = null) => {
    try {
      let url = `/api/practice-test-questions?practice_test_id=${testId}&module_number=${moduleNumber}`;
      
      if (moduleNumber === 2 && isHarder !== null) {
        url += `&is_harder=${isHarder}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch module ${moduleNumber} questions`);
      }
      
      const data = await response.json();
      
      if (!data || !data.questions || data.questions.length === 0) {
        throw new Error(`No questions found for module ${moduleNumber}`);
      }
      
      if (moduleNumber === 1) {
        setModule1Questions(data.questions);
      } else {
        setModule2Questions(data.questions);
      }
      
      return data.questions;
    } catch (err) {
      console.error(`Error fetching module ${moduleNumber} questions:`, err);
      setError(err.message);
      return [];
    }
  };
  
  // Handle answering a question
  const handleAnswer = async (questionId, optionId, isCorrect) => {
    try {
      // Update local state
      const newAnswers = currentModule === 1
        ? { ...module1Answers, [questionId]: { optionId, isCorrect } }
        : { ...module2Answers, [questionId]: { optionId, isCorrect } };
      
      if (currentModule === 1) {
        setModule1Answers(newAnswers);
      } else {
        setModule2Answers(newAnswers);
      }
      
      // Submit the answer to the API
      const response = await fetch('/api/submit-practice-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_id: questionId,
          selected_option_id: optionId,
          is_correct: isCorrect,
          test_id: testId
        }),
      });
      
      if (!response.ok) {
        console.error('Failed to submit answer to API');
      }
    } catch (err) {
      console.error('Error handling answer:', err);
    }
  };
  
  // Toggle flagging a question
  const toggleFlagged = (questionIndex) => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionIndex)) {
        newSet.delete(questionIndex);
      } else {
        newSet.add(questionIndex);
      }
      return newSet;
    });
  };
  
  // Complete the current module and move to the next
  const handleModuleComplete = () => {
    // Calculate score for the current module
    const questions = currentModule === 1 ? module1Questions : module2Questions;
    const answers = currentModule === 1 ? module1Answers : module2Answers;
    
    let correctCount = 0;
    let totalAnswered = 0;
    
    for (const question of questions) {
      if (answers[question.id] && answers[question.id].isCorrect) {
        correctCount++;
      }
      if (answers[question.id]) {
        totalAnswered++;
      }
    }
    
    const scorePercentage = questions.length > 0
      ? Math.round((correctCount / questions.length) * 100)
      : 0;
    
    if (currentModule === 1) {
      setModule1Score(scorePercentage);
      setModule1Completed(true);
      
      // Determine Module 2 difficulty based on Module 1 score
      // Thresholds: Math 14/22 (~64%), Reading & Writing 18/27 (~67%)
      const defaultModuleQuestions = subject?.includes('Math') ? 22 : 27;
      const thresholdCorrect = subject?.includes('Math') ? 14 : 18;
      const useHarderModule = correctCount >= thresholdCorrect;
      setIsHarderModule2(useHarderModule);
      
      // Fetch Module 2 questions with appropriate difficulty
      fetchModuleQuestions(2, useHarderModule).then(() => {
        setCurrentModule(2);
        setCurrentQuestionIndex(0);
        setFlaggedQuestions(new Set());
        
        // Reset timer for Module 2
        const initialTime = subject?.includes('Math')
          ? 35 * 60  // 35 minutes in seconds for Math
          : 32 * 60; // 32 minutes in seconds for Reading & Writing
        
        setTimeRemaining(initialTime);
      });
      
    } else {
      setModule2Score(scorePercentage);
      setModule2Completed(true);
      handleSubmitTest();
    }
  };
  
  // Navigate between questions
  const goToNextQuestion = () => {
    const questions = currentModule === 1 ? module1Questions : module2Questions;
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const goToQuestion = (index) => {
    const questions = currentModule === 1 ? module1Questions : module2Questions;
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };
  
  // Submit the entire test
  const handleSubmitTest = async () => {
    try {
      const module1AnswersForSubmit = Object.entries(module1Answers).map(([questionId, answer]) => ({
        question_id: parseInt(questionId),
        selected_option_id: answer.optionId,
        is_correct: answer.isCorrect
      }));
      
      const module2AnswersForSubmit = Object.entries(module2Answers).map(([questionId, answer]) => ({
        question_id: parseInt(questionId),
        selected_option_id: answer.optionId,
        is_correct: answer.isCorrect
      }));
      
      const response = await fetch('/api/submit-practice-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          practice_test_id: parseInt(testId),
          module1_answers: module1AnswersForSubmit,
          module2_answers: module2AnswersForSubmit,
          module1_score: module1Score,
          module2_score: module2Score,
          used_harder_module: isHarderModule2
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit test');
      }
      
      const data = await response.json();
      
      setTestResults(data.testSummary);
      setShowResultsModal(true);
    } catch (err) {
      console.error('Error submitting test:', err);
      setError('Failed to submit test results. Please try again.');
    }
  };
  
  // Format time display
  const formatTimeDisplay = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Get question status for navigation
  const getQuestionStatus = (index) => {
    const questions = currentModule === 1 ? module1Questions : module2Questions;
    const answers = currentModule === 1 ? module1Answers : module2Answers;
    
    if (index === currentQuestionIndex) return 'current';
    if (flaggedQuestions.has(index)) return 'flagged';
    if (answers[questions[index]?.id]) return 'answered';
    return 'unanswered';
  };
  
  // Current question data
  const currentQuestions = currentModule === 1 ? module1Questions : module2Questions;
  const currentQuestion = currentQuestions[currentQuestionIndex];
  const currentAnswers = currentModule === 1 ? module1Answers : module2Answers;
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar title={`Practice Test`} />
        <div className="flex justify-center items-center h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar title={`Practice Test`} />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">Something went wrong</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/practice-tests')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Back to Practice Tests
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Test completed - show results
  if (showResultsModal) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar title={`Test Results`} />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Completed!</h2>
              <p className="text-gray-600">{testName}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500 mb-1">Overall Score</p>
                <p className="text-4xl font-bold text-emerald-600 mb-4">{testResults?.score}%</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <p className="text-sm font-medium text-gray-500 mb-1">Module 1</p>
                  <p className="text-xl font-semibold text-gray-900">{testResults?.module1Score}%</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <p className="text-sm font-medium text-gray-500 mb-1">Module 2 {testResults?.usedHarderModule ? '(Harder)' : '(Easier)'}</p>
                  <p className="text-xl font-semibold text-gray-900">{testResults?.module2Score}%</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Correct Answers</span>
                <span className="font-medium text-emerald-600">{testResults?.correctAnswers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Incorrect Answers</span>
                <span className="font-medium text-red-600">{testResults?.incorrectAnswers}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Questions</span>
                <span className="font-medium text-gray-900">{testResults?.totalQuestions}</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push('/progress')}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                View Progress
              </button>
              <button
                onClick={() => router.push('/practice-tests')}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Back to Tests
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Instructions modal
  if (showInstructionsModal) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar title={`Practice Test: ${testName}`} />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Test Instructions</h2>
            
            <div className="space-y-4 mb-8">
              <p className="text-gray-600">
                You are about to start <strong>{testName}</strong>, a timed practice test 
                that simulates the actual Digital PSAT exam experience.
              </p>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-700 font-medium mb-2">Test Format</p>
                <ul className="space-y-2 text-blue-700">
                  <li>• This test consists of two modules, each timed separately.</li>
                  <li>• Module 1 will present questions of varying difficulty levels.</li>
                  <li>• Based on your performance in Module 1, you'll receive either an easier or harder Module 2.</li>
                </ul>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg">
                <p className="text-amber-700 font-medium mb-2">Time Limits</p>
                <ul className="space-y-2 text-amber-700">
                  <li>• Each module is timed separately.</li>
                  <li>• For Math: 35 minutes per module (22 questions each)</li>
                  <li>• For Reading & Writing: 32 minutes per module (27 questions each)</li>
                  <li>• The timer will start when you begin the test.</li>
                </ul>
              </div>
              
              <div className="bg-emerald-50 p-4 rounded-lg">
                <p className="text-emerald-700 font-medium mb-2">Navigation</p>
                <ul className="space-y-2 text-emerald-700">
                  <li>• Use the arrows or question numbers to navigate between questions.</li>
                  <li>• You can flag questions to review later.</li>
                  <li>• When you've completed all questions in a module, you can review your answers before submitting.</li>
                </ul>
              </div>
            </div>
            
            <button
              onClick={() => setShowInstructionsModal(false)}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Start Test
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Submit confirmation modal
  if (showSubmitModal) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar title={`Practice Test: ${testName}`} />
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {currentModule === 1 ? 'Submit Module 1?' : 'Submit Test?'}
            </h3>
            
            <p className="text-gray-600 mb-6">
              {currentModule === 1
                ? 'Are you sure you want to submit Module 1? You will not be able to return to these questions.'
                : 'Are you sure you want to submit the entire test? Your results will be recorded and you cannot change your answers afterward.'}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  handleModuleComplete();
                }}
                className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Main test interface
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar title={`Practice Test: ${testName} - Module ${currentModule}`} />
      
      {/* Timer and Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-12">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              <span className={`font-medium ${timeRemaining < 300 ? 'text-red-600' : ''}`}>
                {formatTimeDisplay(timeRemaining)}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Question {currentQuestionIndex + 1} of {currentQuestions.length}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => toggleFlagged(currentQuestionIndex)}
              className={`p-1.5 rounded-full ${
                flaggedQuestions.has(currentQuestionIndex) 
                  ? 'text-amber-600 bg-amber-50' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Flag className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {currentQuestion ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                {/* Question content */}
                <div className="mb-8">
                  {currentQuestion.image_url && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <Image 
                        src={currentQuestion.image_url} 
                        alt="Question image"
                        width={800}
                        height={400}
                        className="w-full object-contain"
                      />
                    </div>
                  )}

                  <div className="prose max-w-none question-text-container">
                    {hasMath(currentQuestion.question_text) ? (
                      <div
                        className="text-gray-900 font-medium"
                        dangerouslySetInnerHTML={{ __html: renderMathFromModule(currentQuestion.question_text) }}
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{currentQuestion.question_text}</p>
                    )}
                  </div>
                </div>
                
                {/* Answer options */}
                <div className="space-y-3">
                  {currentQuestion.options?.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleAnswer(currentQuestion.id, option.id, option.is_correct)}
                      className={`w-full flex items-start p-4 rounded-lg border ${
                        currentAnswers[currentQuestion.id]?.optionId === option.id
                          ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-500'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`flex-shrink-0 h-5 w-5 mr-3 rounded-full border ${
                        currentAnswers[currentQuestion.id]?.optionId === option.id
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-gray-300'
                      } flex items-center justify-center mt-0.5`}>
                        {currentAnswers[currentQuestion.id]?.optionId === option.id && (
                          <div className="h-2 w-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <div className="text-left">
                        <span className="font-medium mr-2">{option.value}.</span>
                        {hasMath(option.label) ? (
                          <span
                            dangerouslySetInnerHTML={{ __html: renderMathFromModule(option.label) }}
                          />
                        ) : (
                          <span>{option.label}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Navigation buttons */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between">
                <button
                  onClick={goToPrevQuestion}
                  disabled={currentQuestionIndex === 0}
                  className={`inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium ${
                    currentQuestionIndex === 0
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </button>
                
                {currentQuestionIndex < currentQuestions.length - 1 ? (
                  <button
                    onClick={goToNextQuestion}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="inline-flex items-center px-4 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
                  >
                    {currentModule === 1 ? 'Submit Module 1' : 'Submit Test'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 p-6 rounded-lg shadow-sm border border-yellow-200 text-center">
              <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
              <p className="text-yellow-700">No questions available for this module.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Question Navigation */}
      <div className="bg-white border-t border-gray-200 py-3 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-2 justify-center">
            {currentQuestions.map((_, index) => (
              <button
                key={index}
                onClick={() => goToQuestion(index)}
                className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-medium ${
                  (() => {
                    const status = getQuestionStatus(index);
                    if (status === 'current') 
                      return 'bg-emerald-600 text-white';
                    if (status === 'flagged' && status === 'answered') 
                      return 'bg-amber-100 text-amber-800 border-2 border-amber-500';
                    if (status === 'flagged') 
                      return 'bg-amber-100 text-amber-800';
                    if (status === 'answered') 
                      return 'bg-emerald-100 text-emerald-800';
                    return 'bg-gray-100 text-gray-600 hover:bg-gray-200';
                  })()
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 