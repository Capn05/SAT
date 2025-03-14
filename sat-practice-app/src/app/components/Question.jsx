'use client'
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { CheckCircle, XCircle } from 'lucide-react';
import ChatSidebar from './ChatSidebar';
import { motion, AnimatePresence } from 'framer-motion';
import MarkdownIt from 'markdown-it';
import markdownItKatex from 'markdown-it-katex';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import QuestionStatus from './QuestionStatus';
import ProgressBar from './ProgressBar';
import Modal from './Modal';
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Question({ subject, mode, skillName, questions: initialQuestions, difficulty }) {
  const [questions, setQuestions] = useState(initialQuestions || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [fadeIn, setFadeIn] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [currentQuestionAnswer, setCurrentQuestionAnswer] = useState(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(skillName || '');
  const router = useRouter()
  const [answeredFeedback, setAnsweredFeedback] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [attempts, setAttempts] = useState({});
  const MAX_ATTEMPTS = 2;  // Maximum attempts before showing correct answer
  const supabase = createClientComponentClient();

  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
  }).use(markdownItKatex);

  md.enable('table');

  const renderMath = (mathString) => {
    try {
      return katex.renderToString(mathString, {
        throwOnError: false,
        displayMode: false,
      });
    } catch (error) {
      console.error('Error rendering math:', error);
      return mathString;
    }
  };

  const renderBlockMath = (mathString) => {
    try {
      return katex.renderToString(mathString, {
        throwOnError: false,
        displayMode: true,
      });
    } catch (error) {
      console.error('Error rendering block math:', error);
      return mathString;
    }
  };

  const renderResponse = (response) => {
    if (!response) return '';
    
    // Normalize underscores - replace more than 5 consecutive underscores with just 5
    response = response.replace(/_{6,}/g, '_____');
    
    response = processTableFormat(response);
    
    const inlineMathRegex = /(?<!\w)\$([^$]+)\$(?!\w)/g; // Matches inline math
    const blockMathRegex = /(?<!\w)\$\$([^$]+)\$\$(?!\w)/g; // Matches block math

    response = response.replace(blockMathRegex, (match, p1) => {
      return renderBlockMath(p1);
    });

    response = response.replace(inlineMathRegex, (match, p1) => {
      return renderMath(p1);
    });

    return md.render(response);
  };

  const processTableFormat = (text) => {
    if (text.includes('|---') || text.includes('| ---')) {
      return text;
    }
    
    const lines = text.split('\n');
    let tableStartIndex = -1;
    let tableEndIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|') && lines[i].split('|').length > 2) {
        if (tableStartIndex === -1) {
          tableStartIndex = i;
        }
        tableEndIndex = i;
      } else if (tableStartIndex !== -1 && tableEndIndex !== -1 && !lines[i].includes('|')) {
        break;
      }
    }
    
    if (tableStartIndex !== -1 && tableEndIndex !== -1 && tableEndIndex > tableStartIndex) {
      const headerRow = lines[tableStartIndex].trim();
      const columnCount = headerRow.split('|').filter(cell => cell.trim()).length;
      
      const separatorRow = '|' + Array(columnCount).fill(' --- ').join('|') + '|';
      
      lines.splice(tableStartIndex + 1, 0, separatorRow);
      
      return lines.join('\n');
    }
    
    return text;
  };

  const fetchUnansweredQuestions = async (subjectId) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user }, error: sessionError } = await supabase.auth.getUser();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        setError('Authentication error');
        return;
      }

      if (!user) {
        console.log('No user found, redirecting to login');
        router.push('/login');
        return;
      }

      // First, fetch the user's answered questions
      console.log('Fetching user answered questions...');
      const { data: userAnswers, error: userAnswersError } = await supabase
        .from('user_answers')
        .select('question_id')
        .eq('user_id', user.id);
      
      if (userAnswersError) {
        console.error('Error fetching user answers:', userAnswersError);
        setError('Error fetching user answer history');
        return;
      }
      
      // Create a set of answered question IDs for quick lookup
      const answeredQuestionIds = new Set(userAnswers?.map(a => a.question_id) || []);
      console.log(`User has answered ${answeredQuestionIds.size} questions previously`);

      // Capitalize the difficulty if it exists and isn't 'mixed'
      let capitalizedDifficulty = difficulty;
      if (difficulty && difficulty !== 'mixed') {
        capitalizedDifficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
        console.log('Capitalized difficulty:', capitalizedDifficulty);
      }

      console.log('Fetching questions for:', { 
        subject: subjectId, 
        mode, 
        skillName, 
        difficulty: capitalizedDifficulty || 'mixed' 
      });
      
      let questionsData;

      if (mode === "test") {
        console.log('Fetching test question...');
        const { data: testQuestions, error: fetchError } = await supabase
          .from('questions')
          .select(`
            *,
            options (*)
          `)
          .eq('subject_id', 1) // Math questions
          .eq('subcategory_id', 1) // Equivalent Expressions
          .order('id', { ascending: false })
          .limit(1);

        if (fetchError) {
          console.error('Error fetching test question:', fetchError);
          setError('Error fetching test question');
          return;
        }

        if (!testQuestions || testQuestions.length === 0) {
          console.error('No test questions found');
          setError('No test questions found');
          return;
        }

        console.log('Found test question:', testQuestions[0]);
        questionsData = testQuestions;
      } else if (mode === "quick") {
        console.log('Fetching quick practice questions for subject:', subjectId, 'with difficulty:', capitalizedDifficulty || 'mixed');
        
        const { count, error: countError } = await supabase
          .from('questions')
          .select('*', { count: 'exact' })
          .eq('subject_id', subjectId);

        if (countError) {
          console.error('Error counting questions:', countError);
          setError('Error counting available questions');
          return;
        }

        // Fetch more questions than needed to account for filtering out answered ones
        const fetchLimit = Math.min(30, count || 0); // Fetch up to 30 questions
        const targetLimit = Math.min(15, count || 0); // But only use up to 15
        
        console.log(`Fetching ${fetchLimit} questions to find ${targetLimit} unanswered ones`);

        if (fetchLimit === 0) {
          setError('No questions available for this subject');
          return;
        }

        let query = supabase
          .from('questions')
          .select(`
            *,
            options(*)
          `)
          .eq('subject_id', subjectId);
        
        // Add difficulty filter if not mixed
        if (capitalizedDifficulty && capitalizedDifficulty !== 'mixed') {
          console.log(`Applying difficulty filter: ${capitalizedDifficulty}`);
          query = query.eq('difficulty', capitalizedDifficulty);
        } else {
          console.log('Using mixed difficulty (no filter applied)');
        }
        
        const { data: allQuestions, error: allQuestionsError } = await query
          .order('id', { ascending: true })
          .limit(fetchLimit);

        if (allQuestionsError) {
          console.error('Error fetching questions:', allQuestionsError);
          setError('Error fetching questions');
          return;
        }

        if (!allQuestions || allQuestions.length === 0) {
          setError('No questions available for this subject');
          return;
        }
        
        // Filter out questions that have already been answered
        const unansweredQuestions = allQuestions.filter(q => !answeredQuestionIds.has(q.id));
        console.log(`Filtered out ${allQuestions.length - unansweredQuestions.length} previously answered questions`);
        
        // If we don't have enough unanswered questions, include some answered ones
        let finalQuestions = unansweredQuestions;

        if (unansweredQuestions.length < targetLimit) {
          console.log(`Not enough unanswered questions (${unansweredQuestions.length}), including some answered ones`);
          const answeredQuestions = allQuestions.filter(q => answeredQuestionIds.has(q.id));
          const neededAnsweredQuestions = targetLimit - unansweredQuestions.length;
          finalQuestions = [
            ...unansweredQuestions,
            ...answeredQuestions.slice(0, neededAnsweredQuestions)
          ];
        }
        
        // Limit to target number and shuffle
        finalQuestions = finalQuestions.slice(0, targetLimit);
        questionsData = shuffleArray(finalQuestions);
        
        console.log(`Successfully prepared ${questionsData.length} questions (${unansweredQuestions.length} unanswered) with difficulty: ${capitalizedDifficulty || 'mixed'}`);
      } else if (mode === "skill" && skillName) {
        console.log(`Fetching skill questions for ${skillName} with difficulty ${difficulty || 'mixed'}`);
        
        // Use the API route that now supports difficulty
        const response = await fetch(`/api/skill-questions?subject=${subjectId}&category=${encodeURIComponent(skillName)}&difficulty=${difficulty || 'mixed'}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error fetching skill questions:', errorData);
          setError(`Failed to load questions: ${errorData.error || response.statusText}`);
          return;
        }
        
        const data = await response.json();
        console.log("Fetched skill questions:", data);
        
        if (!data.questions || data.questions.length === 0) {
          setError(`No questions available for ${skillName}`);
          return;
        }
        
        questionsData = data.questions;
        console.log(`Successfully fetched ${questionsData.length} skill questions`);
      } else {
        setError(`Unsupported mode: ${mode}`);
        return;
      }

      if (!questionsData || questionsData.length === 0) {
        setError('No questions available');
        return;
      }

      setAnsweredQuestions(new Set());
      setAnsweredCount(0);
      setUserAnswers({});
      setAnsweredFeedback({});
      setCurrentQuestionAnswer(null);
      setFeedback(null);
      
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error in fetchUnansweredQuestions:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    console.log('Question component initialized with:', { subject, mode, skillName, difficulty });
    
    if (subject) {
      console.log('Fetching questions for:', { subject, mode, skillName, difficulty });
      fetchUnansweredQuestions(subject);  
    }
  }, [subject, mode, skillName, difficulty]);

  useEffect(() => {
    const limit = mode === "skill" ? 5 : 15;

    if (answeredCount === limit) {
      setShowModal(true);
    }
  }, [answeredCount, mode]);

  useEffect(() => {
    if (questions.length > 0) {
      const questionId = questions[currentIndex].id;
      setCurrentQuestionAnswer(userAnswers[questionId] || null);
      setFeedback(answeredFeedback[questionId] || null);
    }
  }, [currentIndex, questions, userAnswers, answeredFeedback]);

  useEffect(() => {
    setSelectedOption(null);
    setShowFeedback(false);
    setFeedback(null);
    setSubmitted(false);
  }, [currentIndex]);

  const nextQuestion = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % questions.length);
    setSelectedAnswer(null);
    setCurrentQuestionAnswer(null);
  };

  const prevQuestion = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + questions.length) % questions.length);
    setSelectedAnswer(null);
    setCurrentQuestionAnswer(null);
  };

  const fetchUserAnswers = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        return;
      }

      if (!session) {
        console.error('No session found');
        router.push('/login');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('user_answers')
        .select('question_id, is_correct')
        .eq('user_id', session.user.id);

      if (fetchError) {
        console.error('Error fetching user answers:', fetchError);
      } else {
        setUserAnswers(data.reduce((acc, answer) => ({
          ...acc,
          [answer.question_id]: answer.is_correct
        }), {}));
      }
    } catch (error) {
      console.error('Error in fetchUserAnswers:', error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!selectedOption) {
      setError('Please select an answer');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const currentQuestionId = questions[currentIndex].id;
    const isFirstAttempt = !(currentQuestionId in attempts);

    try {
      if (isFirstAttempt) {
        const response = await fetch('/api/user-answers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questionId: currentQuestionId,
            optionId: selectedOption.id,
            isCorrect: selectedOption.is_correct,
            subject: subject,
            mode: mode
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('Error response:', data);
          
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          
          throw new Error(data.error || 'Failed to submit answer');
        }

        console.log('Answer recorded successfully:', data);
      }

      setAttempts(prev => ({
        ...prev,
        [currentQuestionId]: {
          count: (prev[currentQuestionId]?.count || 0) + 1,
          selectedOptions: [...(prev[currentQuestionId]?.selectedOptions || []), selectedOption.id]
        }
      }));
      
      if (selectedOption.is_correct) {
        setAnsweredQuestions(prev => new Set([...prev, currentQuestionId]));
        setAnsweredCount(prev => prev + 1);
        setUserAnswers(prev => ({
          ...prev,
          [currentQuestionId]: selectedOption.id
        }));
        
        setShowFeedback(true);
        setFeedback({
          type: 'success',
          message: 'Correct! Well done!'
        });
        
        setAnsweredFeedback(prev => ({
          ...prev,
          [currentQuestionId]: {
            type: 'success',
            message: 'Correct! Well done!'
          }
        }));
      } else {
        setShowFeedback(true);
        setFeedback({
          type: 'error',
          message: 'Incorrect. Try again!'
        });

        setAnsweredFeedback(prev => ({
          ...prev,
          [currentQuestionId]: {
            type: 'error',
            message: 'Incorrect. Try again!'
          }
        }));

        setFadeIn(true);
        setTimeout(() => {
          setFadeIn(false);
        }, 3000);
      }

    } catch (error) {
      console.error('Error submitting answer:', error);
      setError(error.message || 'Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectQuestion = (index) => {
    setCurrentIndex(index);
    setSelectedAnswer(null);
    setCurrentQuestionAnswer(null);
  };

  const fetchNewQuestions = async () => {
    setCurrentIndex(0);
    setAnsweredCount(0);
    setAnsweredQuestions(new Set());

    await fetchUnansweredQuestions(subject);

    setShowModal(false);
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading questions...</div>
        <div style={styles.loadingDetails}>
          Mode: {mode}, Subject: {subject}, Skill: {skillName || 'N/A'}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorText}>Error: {error}</div>
        <button 
          style={styles.retryButton}
          onClick={() => fetchUnansweredQuestions(subject)}
        >
          Retry
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>No questions available</div>
        <div style={styles.loadingDetails}>
          Mode: {mode}, Subject: {subject}, Skill: {skillName || 'N/A'}
        </div>
      </div>
    );
  }

  const { question_text, options, image_url } = questions[currentIndex];
  console.log('Rendering question:', { question_text, options, currentIndex });
  const sortedOptions = options.sort((a, b) => a.value.localeCompare(b.value));

  const handleDashboardClick = () => {
    router.push('/home')
  }

  const renderOptions = () => {
    const currentQuestionId = questions[currentIndex].id;
    const isAnswered = answeredQuestions.has(currentQuestionId);
    const currentAttempts = attempts[currentQuestionId];
    const correctAnswerId = userAnswers[currentQuestionId];

    return sortedOptions.map((option) => {
      const wasSelected = currentAttempts?.selectedOptions?.includes(option.id);
      const showIncorrectFeedback = wasSelected && !option.is_correct;
      const isCorrectAnswer = option.id === correctAnswerId;
      const isSelected = selectedOption?.id === option.id;
      
      return (
        <div key={option.id}>
          <button
            type="button"
            onClick={() => {
              setSelectedOption(option);
              setCurrentQuestionAnswer(option.value);
              setSelectedAnswer(option.value);
            }}
            disabled={isAnswered}
            style={{
              ...styles.choiceButton,
              border: isSelected ? '1px solid #4338ca' : '1px solid #e5e7eb',
              backgroundColor: isSelected ? 'rgba(67, 56, 202, 0.05)' : 'white',
              boxShadow: isSelected ? '0 4px 10px rgba(0, 0, 0, 0.1)' : 'none',
              transform: isSelected ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease, border 0.2s ease',
              cursor: isAnswered ? 'default' : 'pointer',
              color: isAnswered && isCorrectAnswer ? '#65a30d' : 
                     showIncorrectFeedback ? '#dc2626' : '#374151',
            }}
          >
            <span style={styles.choiceLetter}>{option.value}.</span>
            <span 
              style={styles.choiceText}
              dangerouslySetInnerHTML={{ __html: renderResponse(option.label) }}
            />
            {isAnswered && isCorrectAnswer && (
              <span style={styles.correctIndicator}>✓</span>
            )}
          </button>
        </div>
      );
    });
  };

  return (
    <div style={styles.column}>
      <div style={styles.progressContainer}>
        <ProgressBar completed={answeredCount} total={mode === "skill" ? 5 : 15} />
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={fetchNewQuestions}
      />

      <div style={styles.container}>
        <QuestionStatus 
          currentIndex={currentIndex} 
          totalQuestions={questions.length} 
          fetchUserAnswers={fetchUserAnswers} 
          onSelectQuestion={selectQuestion}
          questions={questions}
        />

        <div style={styles.questionContent}>
          <h2 style={styles.title}>Question {currentIndex + 1}:</h2>
          
          <div 
            style={styles.questionText}
            dangerouslySetInnerHTML={{ __html: renderResponse(question_text) }}
            className="question-text-container"
          />

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.optionsContainer}>
              {renderOptions()}
            </div>
            
            <button 
              style={styles.submitButton}
              type="submit"
              disabled={isSubmitting || !selectedOption || answeredQuestions.has(questions[currentIndex].id)}
            >
              {isSubmitting ? 'Submitting...' : answeredQuestions.has(questions[currentIndex].id) ? 'Answered' : 'Submit Answer'}
            </button>
          </form>

          <AnimatePresence>
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                style={{ 
                  ...styles.feedbackBox, 
                  backgroundColor: feedback?.type === "success" ? '#d4edda' : '#f8d7da',
                  color: feedback?.type === "success" ? '#155724' : '#721c24',
                  borderColor: feedback?.type === "success" ? '#c3e6cb' : '#f5c6cb'
                }}
              >
                {feedback?.type === "success" ? 
                  <CheckCircle style={{ ...styles.icon, color: '#155724' }} /> : 
                  <XCircle style={{ ...styles.icon, color: '#721c24' }} />
                }
                <span>{feedback?.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={styles.navigationContainer}>
            <button
              style={styles.navButton}
              onClick={prevQuestion}
              disabled={currentIndex === 0}
            >
              Previous
            </button>
            <button
              style={styles.navButton}
              onClick={nextQuestion}
              disabled={currentIndex === questions.length - 1}
            >
              Next
            </button>
          </div>
        </div>

        <div style={styles.aiChatContainer}>
          <ChatSidebar 
            questionText={question_text} 
            selectedAnswer={selectedAnswer} 
            options={sortedOptions} 
            imageURL={image_url} 
          />
        </div>
      </div>

      {answeredCount === (mode === "skill" ? 5 : 15) && (
        <div style={styles.RefreshQuestionsContainer}>
          <button onClick={() => setShowModal(true)} style={styles.newQuestionsButton}>
            Continue
          </button>
          <button style={styles.secondaryButton} onClick={handleDashboardClick}>
            Return to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  column: {
    display: 'flex',
    flexDirection: 'column',
  },
  container: {
    display: 'flex',
    flexDirection: 'row',
    padding: '10px 20px 10px 20px',
    backgroundColor: '#f9fafb',
    minHeight: '100vh',
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    padding: '20px 20px 10px 20px',
    backgroundColor: 'rgb(249, 250, 251)',
    marginRight: '41.5%'
  },
  questionContent: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    margin: '10px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#1f2937',
  },
  questionText: {
    fontSize: '18px',
    lineHeight: '1.6',
    color: '#1f2937',
    marginBottom: '24px',
    '& table': {
      borderCollapse: 'collapse',
      width: '100%',
      margin: '16px 0',
      fontSize: '16px',
    },
    '& th, & td': {
      border: '1px solid #e5e7eb',
      padding: '8px 12px',
      textAlign: 'left',
    },
    '& th': {
      backgroundColor: '#f9fafb',
      fontWeight: '600',
    },
    '& tr:nthChild(even)': {
      backgroundColor: '#f9fafb',
    },
    '& tr:hover': {
      backgroundColor: '#f3f4f6',
    },
  },
  questionImage: {
    maxWidth: '100%',
    height: 'auto',
    marginBottom: '24px',
    borderRadius: '4px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  optionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  submitButton: {
    padding: '12px 24px',
    backgroundColor: '#65a30d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    marginTop: '20px',
    '&:disabled': {
      backgroundColor: '#e5e7eb',
      cursor: 'not-allowed',
    },
    '&:hover:not(:disabled)': {
      backgroundColor: '#4d7c0f',
    },
  },
  navigationContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '24px',
  },
  navButton: {
    padding: '10px 20px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    '&:disabled': {
      backgroundColor: '#e5e7eb',
      color: '#9ca3af',
      cursor: 'not-allowed',
    },
    '&:hover:not(:disabled)': {
      backgroundColor: '#4338ca',
    },
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: '#f9fafb',
    },
  },
  radioInput: {
    marginRight: '12px',
  },
  radioText: {
    fontSize: '16px',
    color: '#374151',
  },
  feedbackBox: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    borderRadius: '6px',
    marginTop: '16px',
    marginBottom: '16px',
    border: '1px solid transparent',
    fontWeight: '500',
  },
  icon: {
    marginRight: '12px',
    width: '20px',
    height: '20px',
  },
  aiChatContainer: {
    width: '43%',
  },
  RefreshQuestionsContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  newQuestionsButton: {
    padding: '8px 16px',
    backgroundColor: '#65a30d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    margin: '5px',
    width: '10%',
  },
  correctIndicator: {
    marginLeft: 'auto',
    color: '#65a30d',
    fontWeight: 'bold',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
  },
  loadingText: {
    fontSize: '18px',
    color: '#4b5563',
    marginBottom: '8px',
  },
  loadingDetails: {
    fontSize: '14px',
    color: '#6b7280',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
  },
  errorText: {
    fontSize: '18px',
    color: '#dc2626',
    marginBottom: '16px',
  },
  retryButton: {
    padding: '8px 16px',
    backgroundColor: '#65a30d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  optionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  choiceButton: {
    width: '100%',
    textAlign: 'left',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: 'white',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    fontFamily: "'Noto Sans', sans-serif",
  },
  choiceLetter: {
    fontWeight: '500',
    marginRight: '12px',
  },
  choiceText: {
    flex: 1,
  },
  correctIndicator: {
    marginLeft: 'auto',
    color: '#65a30d',
    fontWeight: 'bold',
    fontSize: '18px',
  },
};
  
  
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
`;

if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = globalStyles;
  document.head.appendChild(styleElement);
}
  
  