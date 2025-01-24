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

export default function Question({ subject }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [fadeIn, setFadeIn] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);

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

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('subject_id', subject)
        .order('id', { ascending: true });

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        return;
      }

      const questionsWithOptions = await Promise.all(
        questionsData.map(async (question) => {
          const { data: optionsData, error: optionsError } = await supabase
            .from('options')
            .select('*')
            .eq('question_id', question.id);

          if (optionsError) {
            console.error('Error fetching options:', optionsError);
            return null;
          }

          return {
            ...question,
            options: optionsData,
          };
        })
      );

      setQuestions(questionsWithOptions.filter(Boolean));
    };

    if (subject) {
      fetchQuestions();
    }
  }, [subject]);

  const nextQuestion = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % questions.length);
    setFeedback(null);
  };

  const prevQuestion = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + questions.length) % questions.length);
    setFeedback(null);
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
      setUserAnswers(data);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const selectedValue = event.target.answer.value;
    setSelectedAnswer(selectedValue);

    const correctOption = questions[currentIndex].options.find(option => option.is_correct);

    if (selectedValue === correctOption.value) {
      setFeedback({ message: "Correct!", type: "success" });
    } else {
      setFeedback({ message: `Option ${selectedValue} is Incorrect. Try asking Ollie for help`, type: "error" });
    }

    // Call the API to save the user's answer
    const { data: { user }, error: userError } = await supabase.auth.getUser(); // Get the current user's ID
    if (userError) {
      console.error('Error fetching user:', userError);
      return; // Exit if there's an error fetching the user
    }

    const userId = user?.id; // Get the current user's ID
    const questionId = questions[currentIndex].id; // Get the current question's ID
    const optionId = questions[currentIndex].options.find(option => option.value === selectedValue)?.id; // Get the selected option's ID
    const isCorrect = selectedValue === correctOption.value; // Determine if the answer is correct

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
    setCurrentIndex(index); // Update the current index to the selected question
    setFeedback(null); // Reset feedback when navigating to a new question
  };

  if (questions.length === 0) return <p>Loading...</p>;

  const { question_text, options, image_url } = questions[currentIndex];
  const sortedOptions = options.sort((a, b) => a.value.localeCompare(b.value));

  return (
    <div style={styles.container}>
      <QuestionStatus 
        currentIndex={currentIndex} 
        totalQuestions={questions.length} 
        fetchUserAnswers={fetchUserAnswers} 
        onSelectQuestion={selectQuestion} // Pass the selectQuestion function
        questions={questions}
      />
      <div style={styles.questionContent}>
        <h2 style={styles.title}>Question {currentIndex + 1}:</h2>
        <div dangerouslySetInnerHTML={{ __html: renderResponse(question_text) }}></div>
        <br />
        {image_url && <img src={image_url} alt="Question related" style={styles.image} />}
        <form onSubmit={handleSubmit} style={styles.form}>
          {sortedOptions.map((option) => (
            <label key={option.value} style={styles.radioLabel}>
              <input
                type="radio"
                name="answer"
                value={option.value}
                style={styles.radioInput}
              />
              <span style={styles.radioText} dangerouslySetInnerHTML={{ __html: renderResponse(option.label) }}></span>
            </label>
          ))}
          <button style={styles.primaryButton} type="submit">Submit Answer</button>
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
};
  
  