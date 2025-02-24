'use client'
import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { CheckCircle, XCircle } from 'lucide-react';
import AIChat from './AIChat';
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

export default function Question({ subject, mode, skillName }) {
  const [questions, setQuestions] = useState([]);
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
  }).use(markdownItKatex);

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
    // Matches inline math only if it is surrounded by word boundaries
    const inlineMathRegex = /(?<!\w)\$([^$]+)\$(?!\w)/g; // Matches inline math
    const blockMathRegex = /(?<!\w)\$\$([^$]+)\$\$(?!\w)/g; // Matches block math

    // Replace block math with rendered output first
    response = response.replace(blockMathRegex, (match, p1) => {
      return renderBlockMath(p1);
    });

    // Replace inline math with rendered output
    response = response.replace(inlineMathRegex, (match, p1) => {
      return renderMath(p1);
    });

    // Render the remaining markdown content
    return md.render(response);
  };

  const fetchUnansweredQuestions = async (subjectId) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found, redirecting to login');
        router.push('/login');
        return;
      }

      if (sessionError) {
        console.error('Session error:', sessionError);
        setError('Authentication error');
        return;
      }

      console.log('Fetching questions for:', { subject: subjectId, mode, skillName });
      let questionsData;

      if (mode === "quick") {
        console.log('Fetching quick practice questions for subject:', subjectId);
        
        // First, check if we have enough questions in the database
        const { count, error: countError } = await supabase
          .from('questions')
          .select('*', { count: 'exact' })
          .eq('subject_id', subjectId);

        if (countError) {
          console.error('Error counting questions:', countError);
          setError('Error counting available questions');
          return;
        }

        const limit = Math.min(15, count || 0);
        console.log(`Using ${limit} questions for quick practice mode (${count} total available)`);

        if (limit === 0) {
          setError('No questions available for this subject');
          return;
        }

        // Get questions for quick mode with proper random ordering
        const { data: allQuestions, error: allQuestionsError } = await supabase
          .from('questions')
          .select(`
            *,
            options(*)
          `)
          .eq('subject_id', subjectId)
          .order('id', { ascending: true }) // Order by id first
          .limit(limit);

        if (allQuestionsError) {
          console.error('Error fetching questions:', allQuestionsError);
          setError('Error fetching questions');
          return;
        }

        if (!allQuestions || allQuestions.length === 0) {
          setError('No questions available for this subject');
          return;
        }

        // Shuffle the questions in JavaScript instead
        questionsData = shuffleArray(allQuestions);

      } else if (mode === "skill") {
        console.log('Fetching skill practice questions for category:', skillName);
        
        // Updated API call to fetch 5 questions for the specific category
        const apiUrl = `/api/skill-questions?category=${encodeURIComponent(skillName)}&subject=${subject}`;
        console.log('API URL:', apiUrl);
        
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok) {
          console.error('API Error:', data);
          throw new Error(data.error || 'Error fetching skill questions');
        }

        if (!data.questions || data.questions.length === 0) {
          throw new Error(`No questions available for ${skillName}`);
        }

        if (data.questions.length < 5) {
          throw new Error(`Not enough questions available for ${skillName}. Need 5, got ${data.questions.length}`);
        }

        questionsData = data.questions;
        console.log(`Successfully fetched ${questionsData.length} questions for ${skillName}`);
      }

      if (!questionsData || questionsData.length === 0) {
        setError('No questions available');
        return;
      }

      // Reset states when loading new questions
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

  // Helper function to shuffle array
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    if (subject) {
      console.log('Initializing question component with:', { subject, mode, skillName });
      fetchUnansweredQuestions(subject);  
    }
  }, [subject]);

  // Automatically show the modal when all questions are answered
  useEffect(() => {
    // Determine the limit based on the mode
    const limit = mode === "skill" ? 5 : 15; // Changed from 4 to 5 questions for skill mode

    if (answeredCount === limit) {
      setShowModal(true);
    }
  }, [answeredCount, mode]);

  // Update currentQuestionAnswer and feedback when changing questions
  useEffect(() => {
    if (questions.length > 0) {
      const questionId = questions[currentIndex].id;
      setCurrentQuestionAnswer(userAnswers[questionId] || null);
      setFeedback(answeredFeedback[questionId] || null);
    }
  }, [currentIndex, questions, userAnswers, answeredFeedback]);

  // Reset states when changing questions
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
        // Update the user answers state in QuestionStatus
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
      // Only send to API if it's the first attempt (for mastery tracking)
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
            category: skillName,
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
      }

      // Update attempts count and record the selected answer
      setAttempts(prev => ({
        ...prev,
        [currentQuestionId]: {
          count: (prev[currentQuestionId]?.count || 0) + 1,
          selectedOptions: [...(prev[currentQuestionId]?.selectedOptions || []), selectedOption.id]
        }
      }));
      
      if (selectedOption.is_correct) {
        // If correct, mark as answered and update count
        setAnsweredQuestions(prev => new Set([...prev, currentQuestionId]));
        setAnsweredCount(prev => prev + 1);
        setUserAnswers(prev => ({
          ...prev,
          [currentQuestionId]: selectedOption.id
        }));

        // If correct, automatically move to next question after delay
        setTimeout(() => {
          if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
          }
        }, 1500);
      } else {
        // Only show feedback for incorrect answers
        setShowFeedback(true);
        setFeedback({
          type: 'error',
          message: 'Incorrect. Try again!'
        });

        // Show animation for incorrect answers
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
    // Reset the current index and answered count
    setCurrentIndex(0);
    setAnsweredCount(0);
    setAnsweredQuestions(new Set()); // Reset the set of answered questions

    // Fetch new unanswered questions
    await fetchUnansweredQuestions(subject); // Call the function to fetch questions

    setShowModal(false); // Close the modal after fetching new questions
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
      <div style={styles.errorContainer}>
        <div style={styles.errorText}>No questions available</div>
        <button 
          style={styles.retryButton}
          onClick={() => fetchUnansweredQuestions(subject)}
        >
          Retry
        </button>
      </div>
    );
  }

  const { question_text, options, image_url } = questions[currentIndex];
  console.log(questions)
  const sortedOptions = options.sort((a, b) => a.value.localeCompare(b.value));

  const handleDashboardClick = () => {
    router.push('/home')
  }

  // Update the radio button rendering
  const renderOptions = () => {
    const currentQuestionId = questions[currentIndex].id;
    const isAnswered = answeredQuestions.has(currentQuestionId);
    const currentAttempts = attempts[currentQuestionId];
    const correctAnswerId = userAnswers[currentQuestionId];

    return sortedOptions.map((option) => {
      const wasSelected = currentAttempts?.selectedOptions?.includes(option.id);
      const showIncorrectFeedback = wasSelected && !option.is_correct;
      const isCorrectAnswer = option.id === correctAnswerId;
      
      return (
        <label key={option.id} style={styles.radioLabel}>
          <input
            type="radio"
            name={`answer-${currentQuestionId}`}
            value={option.id}
            checked={selectedOption?.id === option.id}
            onChange={() => {
              setSelectedOption(option);
              setCurrentQuestionAnswer(option.value);
              setSelectedAnswer(option.value);
            }}
            disabled={isAnswered}
            style={{
              ...styles.radioInput,
              cursor: isAnswered ? 'default' : 'pointer',
            }}
          />
          <span 
            style={{
              ...styles.radioText,
              color: isAnswered && isCorrectAnswer ? '#65a30d' : 
                     showIncorrectFeedback ? '#dc2626' : 'inherit',
              fontWeight: isAnswered && isCorrectAnswer ? '600' : 'normal',
            }} 
            dangerouslySetInnerHTML={{ __html: renderResponse(option.label) }}
          />
          {isAnswered && isCorrectAnswer && (
            <span style={styles.correctIndicator}>✓</span>
          )}
        </label>
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
          <div dangerouslySetInnerHTML={{ __html: renderResponse(question_text) }}></div>
          <br />
          {image_url && <img src={image_url} alt="Question related" style={styles.image} />}
          <form onSubmit={handleSubmit} style={styles.form}>
            {renderOptions()}
            <button 
              style={styles.primaryButton} 
              type="submit"
              disabled={isSubmitting || !selectedOption}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          </form>
          <AnimatePresence>
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                style={{ ...styles.feedbackBox, backgroundColor: feedback?.type === "success" ? '#d4edda' : '#f8d7da' }}
              >
                {feedback?.type === "success" ? <CheckCircle style={styles.icon} /> : <XCircle style={styles.icon} />}
                <span>{feedback?.message}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <div style={styles.navigationButtons}>
            <button style={styles.secondaryButton} onClick={prevQuestion}>Previous</button>
            <button style={styles.secondaryButton} onClick={nextQuestion}>Next</button>
          </div>
        </div>
        <div style={styles.aiChatContainer}>
          <AIChat question={question_text} selectedAnswer={selectedAnswer} options={sortedOptions} imageURL={image_url} />
        </div>
      </div>
      {answeredCount === (mode === "skill" ? 5 : 15) && (
        <div style={styles.RefreshQuestionsContainer}>
          <button onClick={() => setShowModal(true)} style={styles.newQuestionsButton}>
            Continue
          </button>
          <button style={styles.secondaryButton} onClick={handleDashboardClick}>Return to Dashboard</button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'row',
    padding: '20px',
  },
  questionContent: {
    flex: 1,
    margin: '10px',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  aiChatContainer: {
    width: '50%',
  },
  title: {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '16px',
  },
  image: {
    maxWidth: '100%',
    height: 'auto',
    marginBottom: '16px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  radioInput: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
  },
  radioText: {
    fontSize: '14px',
  },
  feedbackBox: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px',
    borderRadius: '5px',
    marginTop: '10px',
    color: '#155724',
    border: '1px solid transparent',
  },
  icon: {
    marginRight: '8px',
    width: '20px',
    height: '20px',
  },
  primaryButton: {
    padding: '8px 16px',
    backgroundColor: '#65a30d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '15px'
  },
  secondaryButton: {
    padding: '8px 16px',
    backgroundColor: '#e6f0e6',
    color: '#333',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  navigationButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '10px',
  },
  column:{
    display: 'flex',
    flexDirection: 'column',
  },
  progressContainer:{
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    flexDirection:"column"
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
    width:"10%"
  },
  RefreshQuestionsContainer:{
    display: 'flex',
    flexDirection: 'row',
    alignItems:"center",
    justifyContent:"center"
  },
  correctIndicator: {
    color: '#65a30d',
    marginLeft: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    margin: '20px',
  },
  loadingText: {
    fontSize: '18px',
    color: '#4b5563',
    marginBottom: '10px',
  },
  loadingDetails: {
    fontSize: '14px',
    color: '#6b7280',
  },
  errorContainer: {
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: '8px',
    margin: '20px',
  },
  errorText: {
    fontSize: '16px',
    color: '#dc2626',
    marginBottom: '15px',
  },
  retryButton: {
    padding: '8px 16px',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
};
  
  