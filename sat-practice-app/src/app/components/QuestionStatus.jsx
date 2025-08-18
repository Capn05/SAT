"use client"
import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

const QuestionStatus = ({ currentIndex, totalQuestions, fetchUserAnswers, onSelectQuestion, questions, answeredQuestionsInSession, sessionAnswers, currentAnswers, questionsInNewSession }) => {
  const [userAnswers, setUserAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchUserAnswersData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setLoading(false);
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
          console.log('Fetched user answers:', data);
          setUserAnswers(data);
        }
      } catch (error) {
        console.error('Error in fetchUserAnswersData:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAnswersData();
  }, [fetchUserAnswers]);

  // Scroll to current question when it changes
  useEffect(() => {
    const currentButton = document.getElementById(`question-${currentIndex}`);
    if (currentButton) {
      currentButton.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  }, [currentIndex]);

  const getStatus = (questionId) => {
    // If this question is in the new session and hasn't been answered yet,
    // show it as not_answered regardless of past history
    if (questionsInNewSession && questionsInNewSession.has(questionId)) {
      return 'not_answered';
    }
    
    // Check if the question was answered in this session
    if (answeredQuestionsInSession && answeredQuestionsInSession.has(questionId)) {
      // Use currentAnswers for visual display (shows green if user eventually got it right)
      if (currentAnswers && questionId in currentAnswers) {
        return currentAnswers[questionId] === true ? 'correct' : 'incorrect';
      }
      // Fallback to sessionAnswers if currentAnswers not available
      if (sessionAnswers && questionId in sessionAnswers) {
        return sessionAnswers[questionId] === true ? 'correct' : 'incorrect';
      }
    }
    
    // Not answered in current session, check user's previous answers
    if (userAnswers && userAnswers.length > 0) {
      const answer = userAnswers.find(ans => ans.question_id === questionId);
      if (answer) {
        return answer.is_correct ? 'correct' : 'incorrect';
      }
    }
    
    return 'not_answered';
  };



  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <style jsx>{`
        .scrollable-container::-webkit-scrollbar {
          width: 4px;
        }
        .scrollable-container::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 2px;
        }
        .scrollable-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }
        .scrollable-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      <div style={styles.container}>
        <div style={styles.statusContainer} className="scrollable-container">
          {questions.map((question, index) => {
            const status = getStatus(question.id);
            const isSelected = index === currentIndex;
            return (
              <button
                key={question.id}
                id={`question-${index}`}
                style={styles.circle(status, isSelected)}
                onClick={() => onSelectQuestion(index)}
              >
                {index + 1} {/* Display the correct question number */}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px',
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '80px',
    margin: '10px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
    maxHeight: '70vh', // Limit height to enable scrolling
    overflow: 'hidden', // Hide overflow on container
  },
  statusContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    overflowY: 'auto', // Enable vertical scrolling
    padding: '8px 5px 8px 0', // Add padding: top right bottom left
    maxHeight: '100%',
    width: '100%',
    alignItems: 'center',
    // Custom scrollbar styling
    scrollbarWidth: 'thin',
    scrollbarColor: '#cbd5e1 #f1f5f9',
  },
  circle: (status, isSelected) => ({
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: status === 'correct' ? '#22c55e' :
                    status === 'incorrect' ? '#ef4444' :
                    '#d1d5db',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '12px',
    outline: isSelected ? '3px solid #4338ca' : 'none',
    outlineOffset: '2px',
    flexShrink: 0, // Prevent circles from shrinking in flex container
  }),
};

export default QuestionStatus; 