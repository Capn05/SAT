'use client'
import { useEffect, useState, useCallback } from 'react';
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
import QuickPracticeCompleteModal from './QuickPracticeCompleteModal';
import SkillsCompleteModal from './SkillsCompleteModal';
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import DifficultyModal from './DifficultyModal';
import { renderMathContent, processTableFormat } from './MathRenderer';

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
  const [submittedOptions, setSubmittedOptions] = useState({});
  const [questionsInNewSession, setQuestionsInNewSession] = useState(new Set());
  const MAX_ATTEMPTS = 2;  // Maximum attempts before showing correct answer
  const supabase = createClientComponentClient();
  const [showQuickPracticeModal, setShowQuickPracticeModal] = useState(false);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [showPostCompleteDifficultyModal, setShowPostCompleteDifficultyModal] = useState(false);
  const [sessionCorrectAnswers, setSessionCorrectAnswers] = useState({});

  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
  }).use(markdownItKatex);

  md.enable('table');

  // Helper function to determine if question is math
  const isMathQuestion = (question) => {
    return question && question.subject_id === 1; // Math questions have subject_id of 1
  };

  // Main rendering function for all content
  const renderResponse = (response, question) => {
    if (!response) return '';
    
    // Normalize underscores
    response = response.replace(/_{6,}/g, '_____');
    
    // Use the renderMathContent function from MathRenderer
    return renderMathContent(response);
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
      console.log(`User has answered ${answeredQuestionIds.size} questions previously in the database`);

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
        
        // First, count all available questions matching the criteria
        const { count, error: countError } = await supabase
          .from('questions')
          .select('*', { count: 'exact' })
          .eq('subject_id', subjectId);

        if (countError) {
          console.error('Error counting questions:', countError);
          setError('Error counting available questions');
          return;
        }

        if (count === 0) {
          setError('No questions available for this subject');
          return;
        }

        // Fetch all questions matching the criteria to sort unanswered vs answered
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
        }
        
        const { data: allQuestions, error: allQuestionsError } = await query;

        if (allQuestionsError) {
          console.error('Error fetching questions:', allQuestionsError);
          setError('Error fetching questions');
          return;
        }

        if (!allQuestions || allQuestions.length === 0) {
          setError('No questions available for this subject and difficulty');
          return;
        }
        
        console.log(`Found ${allQuestions.length} total questions matching criteria`);
        
        // Separate questions into unanswered and previously answered
        const unansweredQuestions = allQuestions.filter(q => !answeredQuestionIds.has(q.id));
        const previouslyAnsweredQuestions = allQuestions.filter(q => answeredQuestionIds.has(q.id));
        
        console.log(`Found ${unansweredQuestions.length} unanswered questions and ${previouslyAnsweredQuestions.length} previously answered questions`);
        
        const targetLimit = 15; // Number of questions for quick practice
        
        // Create the final set of questions
        let finalQuestions = [];
        
        // If we have enough unanswered questions, use only those
        if (unansweredQuestions.length >= targetLimit) {
          console.log(`Using ${targetLimit} unanswered questions`);
          finalQuestions = shuffleArray(unansweredQuestions).slice(0, targetLimit);
        }
        // Otherwise, use all available unanswered questions and fill the rest with previously answered ones
        else {
          console.log(`Using all ${unansweredQuestions.length} unanswered questions and ${targetLimit - unansweredQuestions.length} previously answered questions`);
          const shuffledPreviouslyAnswered = shuffleArray(previouslyAnsweredQuestions);
          finalQuestions = [
            ...unansweredQuestions,
            ...shuffledPreviouslyAnswered.slice(0, targetLimit - unansweredQuestions.length)
          ];
        }
        
        // Shuffle the options for each question
        questionsData = finalQuestions.map(q => ({
          ...q,
          options: shuffleArray(q.options)
        }));
        
        console.log(`Prepared ${questionsData.length} questions for practice`);
      } else if (mode === "skill" && skillName) {
        console.log(`Fetching skill questions for ${skillName} with difficulty ${difficulty || 'mixed'}`);
        
        // Use the API route that supports difficulty
        const response = await fetch(`/api/skill-questions?subject=${subjectId}&category=${encodeURIComponent(skillName)}&difficulty=${difficulty || 'mixed'}&previouslyAnswered=true`);
        
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

      // Reset only the session-specific state
      // When loading previously answered questions, they should appear as new
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
    
    let mounted = true;
    
    if (subject) {
      console.log('Fetching questions for:', { subject, mode, skillName, difficulty });
      fetchUnansweredQuestions(subject);  
    }
    
    // Cleanup function to reset state when the component unmounts
    return () => {
      mounted = false;
      setAnsweredCount(0);
      setAnsweredQuestions(new Set());
      setShowModal(false);
      setShowQuickPracticeModal(false);
      setShowSkillsModal(false);
    };
  }, [subject, mode, skillName, difficulty]);

  // Add this function to refresh skills cache
  const refreshSkillsCache = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Refreshing skills cache...');
      const response = await fetch('/api/refresh-skills-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          subject: subject
        }),
      });

      if (!response.ok) {
        console.error('Failed to refresh skills cache:', await response.json());
      } else {
        console.log('Skills cache refreshed successfully');
      }
    } catch (error) {
      console.error('Error refreshing skills cache:', error);
    }
  }, [subject]);

  // Update the useEffect that shows the completion modals to also refresh the skills cache
  useEffect(() => {
    const limit = mode === "skill" ? 5 : 15;

    if (answeredCount === limit) {
      // First refresh the skills cache
      refreshSkillsCache();
      
      // Then show the appropriate modal based on the mode
      if (mode === "skill") {
        setShowSkillsModal(true);
      } else {
        setShowQuickPracticeModal(true);
      }
    }
    
    // Reset modal visibility when answeredCount changes but isn't at the limit
    if (answeredCount > 0 && answeredCount < limit) {
      setShowSkillsModal(false);
      setShowQuickPracticeModal(false);
    }
  }, [answeredCount, mode, refreshSkillsCache]);

  useEffect(() => {
    if (questions.length > 0) {
      // Get the current question ID
      const currentQuestionId = questions[currentIndex].id;
      
      // Only reset the state if this is a new question set or if the question hasn't been answered
      if (!answeredQuestions.has(currentQuestionId)) {
        resetQuestionState(currentQuestionId);
      }
    }
  }, [questions]);

  const resetQuestionState = (questionId) => {
    // Check if this question was already answered in this session
    const isAnsweredInSession = answeredQuestions.has(questionId);
    
    // If already answered in this session, don't reset the state
    if (isAnsweredInSession) {
      // Just restore the feedback and selectedOption if it exists
      if (answeredFeedback[questionId]) {
        setFeedback(answeredFeedback[questionId]);
        setTimeout(() => {
          setShowFeedback(true);
        }, 50);
      }
      
      // Try to find the selected option for this question
      const selectedOptionId = userAnswers[questionId];
      if (selectedOptionId) {
        // Find the option from the current question's options
        const currentQuestion = questions.find(q => q.id === questionId);
        if (currentQuestion) {
          const option = currentQuestion.options.find(o => o.id === selectedOptionId);
          if (option) {
            setSelectedOption(option);
            setCurrentQuestionAnswer(option.value);
            setSelectedAnswer(option.value);
          }
        }
      }
      return;
    }
    
    // Only reset if not answered in this session
    setSelectedOption(null);
    setSelectedAnswer(null);
    setFeedback(null);
    setCurrentQuestionAnswer(null);
    setShowFeedback(false);
    setSubmitted(false);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      // Hide feedback first before changing index to avoid flicker
      setShowFeedback(false);
      
      // Use setTimeout to ensure the feedback is hidden before changing the question
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        
        // Reset or restore state based on whether this question was answered in this session
        const nextQuestionId = questions[currentIndex + 1].id;
        resetQuestionState(nextQuestionId);
      }, 50);
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      // Hide feedback first before changing index to avoid flicker
      setShowFeedback(false);
      
      // Use setTimeout to ensure the feedback is hidden before changing the question
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1);
        
        // Reset or restore state based on whether this question was answered in this session
        const prevQuestionId = questions[currentIndex - 1].id;
        resetQuestionState(prevQuestionId);
      }, 50);
    }
  };

  const selectQuestion = (index) => {
    // Hide feedback first before changing index to avoid flicker
    setShowFeedback(false);
    
    // Use setTimeout to ensure the feedback is hidden before changing the question
    setTimeout(() => {
      setCurrentIndex(index);
      
      // Reset or restore state based on whether this question was answered in this session
      const selectedQuestionId = questions[index].id;
      resetQuestionState(selectedQuestionId);
    }, 50);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedOption) return;
    
    setIsSubmitting(true);
    setShowFeedback(false);
    
    try {
      const currentQuestionId = questions[currentIndex].id;
      
      // Check if this is first attempt at this question
      const isFirstAttempt = !answeredQuestions.has(currentQuestionId);
      
      // Check if this question was already counted as correct in our progress
      const isAlreadyCountedAsCorrect = sessionCorrectAnswers[currentQuestionId] === true;
      
      // Only submit to database on first attempt
      if (isFirstAttempt) {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.error('No user found');
          router.push('/login');
          return;
        }
        
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('No session found');
          router.push('/login');
          return;
        }
        
        // Record the answer in the database
        const response = await fetch('/api/user-answers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questionId: currentQuestionId,
            optionId: selectedOption.id,
            isCorrect: selectedOption.is_correct,
            mode: mode || 'practice',
            subject: subject
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

        console.log('Answer recorded successfully with details:', {
          data,
          mode,
          subject,
          skillName: skillName || 'N/A',
          questionId: currentQuestionId
        });
        
        // Mark the question as answered in our session tracking on first attempt only
        setAnsweredQuestions(prev => new Set([...prev, currentQuestionId]));
        
        // Store the first-attempt correctness in session - NEVER change this on subsequent attempts
        setSessionCorrectAnswers(prev => ({
          ...prev,
          [currentQuestionId]: selectedOption.is_correct
        }));
        
        // Store the answer for this question regardless of correctness
        setUserAnswers(prev => ({
          ...prev,
          [currentQuestionId]: selectedOption.id
        }));
        
        // Increment answered count if correct on first attempt
        if (selectedOption.is_correct) {
          setAnsweredCount(prev => prev + 1);
        }

        // After submitting, remove this question from the new session tracking
        setQuestionsInNewSession(prev => {
          const updated = new Set(prev);
          updated.delete(currentQuestionId);
          return updated;
        });
      } else if (selectedOption.is_correct && !isAlreadyCountedAsCorrect) {
        // If this is a correct answer on a subsequent attempt and we haven't counted it yet,
        // update the answered count but DO NOT change the sessionCorrectAnswers state
        setAnsweredCount(prev => prev + 1);
      }

      // Track attempt count and selected options for all attempts
      setAttempts(prev => ({
        ...prev,
        [currentQuestionId]: {
          count: (prev[currentQuestionId]?.count || 0) + 1,
          selectedOptions: [...(prev[currentQuestionId]?.selectedOptions || []), selectedOption.id]
        }
      }));
      
      // Track which option was just submitted for this question
      setSubmittedOptions(prev => ({
        ...prev,
        [currentQuestionId]: selectedOption.id
      }));
      
      // Show feedback based on correctness
      if (selectedOption.is_correct) {
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

  const fetchNewQuestions = async () => {
    // First close all modals
    setShowModal(false);
    setShowQuickPracticeModal(false);
    setShowSkillsModal(false);
    
    // Complete reset of all state for a new question set
    setCurrentIndex(0);
    setAnsweredCount(0);
    setAnsweredQuestions(new Set());
    setUserAnswers({});
    setAnsweredFeedback({});
    setCurrentQuestionAnswer(null);
    setFeedback(null);
    setSelectedOption(null);
    setSelectedAnswer(null);
    setSubmitted(false);
    setAttempts({});
    setShowFeedback(false);
    setSessionCorrectAnswers({}); // Reset session correct answers
    setSubmittedOptions({}); // Reset submitted options
    setQuestionsInNewSession(new Set()); // Reset the new session questions tracking
    
    // Log that we're starting a new set of practice questions
    console.log('Starting a new set of practice questions');
    
    // Then fetch new questions
    await fetchUnansweredQuestions(subject);
  };

  // Add a useEffect to ensure feedback is properly displayed for questions already answered
  useEffect(() => {
    if (questions.length > 0) {
      const currentQuestionId = questions[currentIndex].id;
      
      // If this question has been answered in this session, show the appropriate feedback
      if (answeredQuestions.has(currentQuestionId) && answeredFeedback[currentQuestionId]) {
        // Wait a short moment to ensure UI has updated
        setTimeout(() => {
          setFeedback(answeredFeedback[currentQuestionId]);
          setShowFeedback(true);
        }, 50);
      }
    }
  }, [currentIndex, questions, answeredQuestions]);

  // Add handlers for more practice option
  const handleMorePractice = useCallback(() => {
    // Close the complete modals
    setShowQuickPracticeModal(false);
    setShowSkillsModal(false);
    
    // Show the difficulty modal after a brief delay
    setTimeout(() => {
      setShowPostCompleteDifficultyModal(true);
    }, 50);
  }, []);

  // Add handler for difficulty selection after completion
  const handlePostCompleteDifficultySelected = useCallback((selectedDifficulty) => {
    setShowPostCompleteDifficultyModal(false);
    
    // Navigate to restart practice with the selected difficulty
    setTimeout(() => {
      // Add a timestamp to force a refresh even when URL parameters are the same
      const timestamp = Date.now();
      
      if (mode === 'quick') {
        // Use window.location instead of router to force a full page refresh
        window.location.href = `/practice?subject=${subject}&mode=quick&difficulty=${selectedDifficulty}&t=${timestamp}`;
      } else if (mode === 'skill' && skillName) {
        window.location.href = `/practice?subject=${subject}&mode=skill&difficulty=${selectedDifficulty}&category=${encodeURIComponent(skillName)}&t=${timestamp}`;
      }
    }, 100);
  }, [subject, mode, skillName]);

  // Update to handle adding questions to the new session tracking
  useEffect(() => {
    if (questions.length > 0) {
      // Add all questions to the new session tracking when questions are loaded
      const allQuestionIds = questions.map(q => q.id);
      setQuestionsInNewSession(new Set(allQuestionIds));
    }
  }, [questions]);

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
    const isAnswered = answeredQuestions.has(currentQuestionId) && sessionCorrectAnswers[currentQuestionId] === true;
    const currentAttempts = attempts[currentQuestionId];
    
    // Find the correct answer option
    const correctOption = sortedOptions.find(option => option.is_correct);
    
    return sortedOptions.map((option) => {
      // Check if this specific option has been submitted
      const wasSelected = currentAttempts?.selectedOptions?.includes(option.id);
      const showIncorrectFeedback = wasSelected && !option.is_correct;
      
      // Only show checkmark if:
      // 1. The option is correct
      // 2. This option is the most recently submitted option
      // 3. The submitted option is correct
      const isSubmittedOption = submittedOptions[currentQuestionId] === option.id;
      const isCorrectAnswerForDisplay = option.is_correct && isSubmittedOption;
      
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
              color: isCorrectAnswerForDisplay ? '#65a30d' : 
                     showIncorrectFeedback ? '#dc2626' : '#374151',
            }}
          >
            <span style={styles.choiceLetter}>{option.value}.</span>
            <span 
              style={styles.choiceText}
              dangerouslySetInnerHTML={{ __html: renderResponse(option.label, questions[currentIndex]) }}
              className={`question-text-container ${isMathQuestion(questions[currentIndex]) ? 'math-content' : 'reading-content'}`}
            />
            {isCorrectAnswerForDisplay && (
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

      <QuickPracticeCompleteModal
        isOpen={showQuickPracticeModal}
        onClose={() => setShowQuickPracticeModal(false)}
        subject={subject}
        difficulty={difficulty}
        mode={mode}
        onMorePractice={handleMorePractice}
      />

      <SkillsCompleteModal
        isOpen={showSkillsModal}
        onClose={() => setShowSkillsModal(false)}
        subject={subject}
        skillName={skillName}
        difficulty={difficulty}
        mode={mode}
        onMorePractice={handleMorePractice}
      />

      {showPostCompleteDifficultyModal && (
        <DifficultyModal
          isOpen={showPostCompleteDifficultyModal}
          onClose={() => setShowPostCompleteDifficultyModal(false)}
          subject={subject}
          title={`Select Difficulty Level for ${mode === 'skill' ? 'Skill' : 'Quick'} Practice`}
          mode={mode}
          category={mode === 'skill' ? skillName : null}
          onDifficultySelected={handlePostCompleteDifficultySelected}
        />
      )}

      <div style={styles.container}>
        <QuestionStatus 
          currentIndex={currentIndex} 
          totalQuestions={questions.length} 
          fetchUserAnswers={fetchUserAnswers} 
          onSelectQuestion={selectQuestion}
          questions={questions}
          answeredQuestionsInSession={answeredQuestions}
          sessionAnswers={sessionCorrectAnswers}
          questionsInNewSession={questionsInNewSession}
        />

        <div style={styles.questionContent}>
          <h2 style={styles.title}>Question {currentIndex + 1}</h2>
          
          <div 
            style={styles.questionText}
            dangerouslySetInnerHTML={{ __html: renderResponse(question_text, questions[currentIndex]) }}
            className={`question-text-container ${isMathQuestion(questions[currentIndex]) ? 'math-question' : 'reading-question'}`}
          />
          
          {/* Add image display if image_url exists */}
          {image_url && (
            <div style={styles.imageContainer}>
              <img 
                src={image_url} 
                alt="Question illustration" 
                style={styles.questionImage}
                onError={(e) => {
                  console.error('Failed to load image:', image_url);
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.optionsContainer}>
              {renderOptions()}
            </div>
            
            <button 
              style={styles.submitButton}
              type="submit"
              disabled={isSubmitting || !selectedOption || (answeredQuestions.has(questions[currentIndex].id) && sessionCorrectAnswers[questions[currentIndex].id] === true)}
            >
              {isSubmitting ? 'Submitting...' : 
                (answeredQuestions.has(questions[currentIndex].id) && sessionCorrectAnswers[questions[currentIndex].id] === true) ? 
                'Answered' : 'Submit Answer'}
            </button>
          </form>

          <AnimatePresence mode="wait">
            {showFeedback && feedback && (
              <motion.div
                key={`feedback-${currentIndex}-${feedback.type}`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ 
                  ...styles.feedbackBox, 
                  backgroundColor: feedback.type === "success" ? '#d4edda' : '#f8d7da',
                  color: feedback.type === "success" ? '#155724' : '#721c24',
                  borderColor: feedback.type === "success" ? '#c3e6cb' : '#f5c6cb'
                }}
              >
                {feedback.type === "success" ? 
                  <CheckCircle style={{ ...styles.icon, color: '#155724' }} /> : 
                  <XCircle style={{ ...styles.icon, color: '#721c24' }} />
                }
                <span>{feedback.message}</span>
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
          {mode === "skill" ? (
            <button onClick={() => setShowSkillsModal(true)} style={styles.newQuestionsButton}>
              Continue
            </button>
          ) : (
            <button onClick={() => setShowQuickPracticeModal(true)} style={styles.newQuestionsButton}>
              Continue
            </button>
          )}
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
    maxHeight: '400px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
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
  secondaryButton: {
    padding: '8px 16px',
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    margin: '5px',
    width: '10%',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#e5e7eb',
    },
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
  imageContainer: {
    width: '100%',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'center',
  },
};