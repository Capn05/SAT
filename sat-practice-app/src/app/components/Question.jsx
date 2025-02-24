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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error('Error fetching user');
      
      const user_id = user.identities[0].id;

      // First, check if we have enough questions in the database
      const { count: totalQuestions, error: countError } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('subject_id', subjectId);

      if (countError) throw new Error('Error counting available questions');

      // Determine the limit based on the mode and available questions
      let limit;
      if (mode === "skill") {
        limit = 4;
        if (totalQuestions < limit) {
          throw new Error(`Not enough questions available for skill practice. Only ${totalQuestions} questions found, but ${limit} are needed.`);
        }
      } else {
        // For quick mode, use either 15 or the total available questions, whichever is smaller
        limit = Math.min(15, totalQuestions);
        console.log(`Using ${limit} questions for quick practice mode`);
      }

      // Step 1: Fetch answered question IDs
      const { data: answeredQuestionsData, error: answeredQuestionsError } = await supabase
        .from('user_answers')
        .select('question_id')
        .eq('user_id', user_id);

      if (answeredQuestionsError) throw new Error('Error fetching answered questions');

      // Extract the question IDs into an array
      const answeredQuestionIds = answeredQuestionsData?.map(answer => answer.question_id) || [];

      let questionsData;
      let query = supabase
        .from('questions')
        .select(`
          *,
          options(*)
        `)
        .eq('subject_id', subjectId);

      if (mode === "quick") {
        try {
          // First try to get all questions for this subject
          const { data: allQuestions, error: allQuestionsError } = await query;
          
          if (allQuestionsError) throw new Error('Error fetching all questions');
          
          // Filter out answered questions if needed
          let availableQuestions = allQuestions;
          if (answeredQuestionIds.length > 0 && answeredQuestionIds.length < totalQuestions) {
            availableQuestions = allQuestions.filter(q => !answeredQuestionIds.includes(q.id));
          }
          
          // If we don't have enough unanswered questions, use all questions
          if (availableQuestions.length < limit) {
            availableQuestions = allQuestions;
          }
          
          // Randomly select questions
          questionsData = shuffleArray(availableQuestions).slice(0, limit);
          
        } catch (error) {
          console.error('Error in quick mode question fetching:', error);
          throw new Error(`Error fetching questions: ${error.message}`);
        }
      }

      if (mode === "skill") {
        try {
          query = query.eq('category', selectedSkill);
          
          // First try to get all questions for this skill
          const { data: allSkillQuestions, error: allSkillQuestionsError } = await query;
          
          if (allSkillQuestionsError) throw new Error('Error fetching skill questions');
          
          if (!allSkillQuestions || allSkillQuestions.length < limit) {
            throw new Error(`Not enough questions available for ${selectedSkill}`);
          }
          
          // Filter out answered questions if needed
          let availableQuestions = allSkillQuestions;
          if (answeredQuestionIds.length > 0) {
            availableQuestions = allSkillQuestions.filter(q => !answeredQuestionIds.includes(q.id));
          }
          
          // If we don't have enough unanswered questions, use all skill questions
          if (availableQuestions.length < limit) {
            availableQuestions = allSkillQuestions;
          }
          
          // Randomly select questions
          questionsData = shuffleArray(availableQuestions).slice(0, limit);
          
        } catch (error) {
          console.error('Error in skill mode question fetching:', error);
          throw new Error(`Error fetching skill questions: ${error.message}`);
        }
      }

      if (!questionsData || questionsData.length === 0) {
        throw new Error('No questions available');
      }

      if (questionsData.length < limit) {
        throw new Error(`Not enough questions returned. Only got ${questionsData.length} out of ${limit} required questions.`);
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
      setQuestions([]);  // Set empty questions array on error
      alert(`Error loading questions: ${error.message}`);
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
      fetchUnansweredQuestions(subject);  
    }

  }, [subject]);

  // Automatically show the modal when all questions are answered
  useEffect(() => {
    // Determine the limit based on the mode
    const limit = mode === "skill" ? 4 : 15; // Limit to 4 questions for skill mode

    if (answeredCount === limit) {
      setShowModal(true);
    }
  }, [answeredCount, mode]); // Add mode as a dependency

  // Update currentQuestionAnswer and feedback when changing questions
  useEffect(() => {
    if (questions.length > 0) {
      const questionId = questions[currentIndex].id;
      setCurrentQuestionAnswer(userAnswers[questionId] || null);
      setFeedback(answeredFeedback[questionId] || null);
    }
  }, [currentIndex, questions, userAnswers, answeredFeedback]);

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
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Error fetching user:', error);
      return;
    }

    if (!user) {
      console.error('No user is logged in');
      return;
    }

    const { data, error: fetchError } = await supabase
      .from('user_answers')
      .select('question_id, is_correct')
      .eq('user_id', user.id);

    if (fetchError) {
      console.error('Error fetching user answers:', fetchError);
    } else {
      // Update the user answers state in QuestionStatus
      setUserAnswers(data.reduce((acc, answer) => ({
        ...acc,
        [answer.question_id]: answer.is_correct
      }), {}));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const currentQuestionId = questions[currentIndex].id;
    const selectedValue = userAnswers[currentQuestionId];
    if (!selectedValue) return;

    const currentQuestion = questions[currentIndex];
    const questionId = currentQuestion.id;

    // Check if the question has already been answered
    if (answeredQuestions.has(questionId)) {
      console.log('Question already answered');
      return;
    }

    // Logic to check if the answer is correct
    const correctOption = currentQuestion.options.find(option => option.is_correct);
    const isCorrect = selectedValue === correctOption.value;

    if (isCorrect) {
      setAnsweredCount(prevCount => prevCount + 1);
      setAnsweredQuestions(prev => new Set(prev).add(questionId));
    }

    const feedbackMessage = isCorrect ? 
      "Correct!" : 
      `Option ${selectedValue} is Incorrect. Try asking Ollie for help`;
    
    const newFeedback = { 
      message: feedbackMessage, 
      type: isCorrect ? "success" : "error" 
    };

    setFeedback(newFeedback);
    setAnsweredFeedback(prev => ({
      ...prev,
      [questionId]: newFeedback
    }));

    setSelectedAnswer(selectedValue);

    // Call the API to save the user's answer
    const { data: { user }, error: userError } = await supabase.auth.getUser(); // Get the current user's ID
    if (userError) {
      console.error('Error fetching user:', userError);
      return; // Exit if there's an error fetching the user
    }

    const userId = user?.id; // Get the current user's ID
    const optionId = currentQuestion.options.find(option => option.value === selectedValue)?.id; // Get the selected option's ID

    console.log('Submitting answer:', { userId, questionId, optionId, isCorrect }); // Log the data being sent

    if (userId && questionId && optionId) {
      try {
        const response = await fetch('/api/user-answers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            questionId,
            optionId,
            isCorrect,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text(); // Get the response text for debugging
          console.error('Error response:', errorText); // Log the error response
          throw new Error('Network response was not ok');
        }

        const result = await response.json();
        console.log('API response:', result);

        // Fetch user answers again to update the status
        fetchUserAnswers(); // Call the function to update user answers
      } catch (error) {
        console.error('Fetch error:', error);
      }
    }

    setFadeIn(true);
    setTimeout(() => {
      setFadeIn(false);
    }, 3000);
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

  if (questions.length === 0) return <p>Loading...</p>;

  const { question_text, options, image_url } = questions[currentIndex];
  console.log(questions)
  const sortedOptions = options.sort((a, b) => a.value.localeCompare(b.value));


 
  const handleDashboardClick = () => {
    router.push('/home')
  }
  return (
    <div style={styles.column}>
      <div style={styles.progressContainer}>
        <ProgressBar completed={answeredCount} total={mode === "skill" ? 4 : 15} />

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
            {sortedOptions.map((option) => {
              const currentQuestionId = questions[currentIndex].id;
              const isAnswered = answeredQuestions.has(currentQuestionId);
              const isCorrectOption = option.is_correct;
              
              return (
                <label key={option.value} style={styles.radioLabel}>
                  <input
                    type="radio"
                    name={`answer-${currentQuestionId}`}
                    value={option.value}
                    checked={currentQuestionAnswer === option.value}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCurrentQuestionAnswer(value);
                      setSelectedAnswer(value);
                      setUserAnswers(prev => ({
                        ...prev,
                        [currentQuestionId]: value
                      }));
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
                      color: isAnswered && isCorrectOption ? '#65a30d' : 'inherit',
                      fontWeight: isAnswered && isCorrectOption ? '600' : 'normal',
                    }} 
                    dangerouslySetInnerHTML={{ __html: renderResponse(option.label) }}
                  />
                  {isAnswered && isCorrectOption && (
                    <span style={styles.correctIndicator}>✓</span>
                  )}
                </label>
              );
            })}
            <button 
              style={styles.primaryButton} 
              type="submit"
              disabled={answeredQuestions.has(questions[currentIndex].id)}
            >
              Submit Answer
            </button>
          </form>
          <AnimatePresence>
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                style={{ ...styles.feedbackBox, backgroundColor: feedback.type === "success" ? '#d4edda' : '#f8d7da' }}
              >
                {feedback.type === "success" ? <CheckCircle style={styles.icon} /> : <XCircle style={styles.icon} />}
                <span>{feedback.message}</span>
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
      {answeredCount === 15 && (
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
};
  
  