"use client"
import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

const QuestionStatus = ({ currentIndex, totalQuestions, fetchUserAnswers, onSelectQuestion, questions, answeredQuestionsInSession, sessionAnswers }) => {
  const [userAnswers, setUserAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const questionsPerPage = 10;
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Calculate the index of the first and last question to display
  const startIndex = currentPage * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const displayedQuestions = questions.slice(startIndex, endIndex);

  const totalPages = Math.ceil(questions.length / questionsPerPage);

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

  useEffect(() => {
    // Calculate which page the current question should be on
    const targetPage = Math.floor(currentIndex / questionsPerPage);
    
    // Update the page if needed
    if (targetPage !== currentPage) {
      setCurrentPage(targetPage);
    }
  }, [currentIndex, questionsPerPage]);

  const getStatus = (questionId) => {
    // Check if the question was answered in this session
    if (answeredQuestionsInSession && answeredQuestionsInSession.has(questionId)) {
      // If in session answers, use that result (which reflects first attempt only)
      if (sessionAnswers && questionId in sessionAnswers) {
        // This status reflects first attempt only, which is stored in sessionAnswers
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

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      {/* Up Arrow Navigation */}
      <div style={styles.pagination}>
        <button onClick={prevPage} disabled={currentPage === 0} style={styles.arrowButton}>
          &#9650; {/* Up Arrow */}
        </button>
      </div>

      <div style={styles.statusContainer}>
        {displayedQuestions.map((question, index) => {
          const status = getStatus(question.id);
          const isSelected = startIndex + index === currentIndex;
          return (
            <button
              key={question.id}
              style={styles.circle(status, isSelected)}
              onClick={() => onSelectQuestion(startIndex + index)}
            >
              {startIndex + index + 1} {/* Display the correct question number */}
            </button>
          );
        })}
      </div>

      {/* Down Arrow Navigation */}
      <div style={styles.pagination}>
        <button onClick={nextPage} disabled={currentPage === totalPages - 1} style={styles.arrowButton}>
          &#9660; {/* Down Arrow */}
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    padding: '10px',
    backgroundColor: 'white',
    borderRadius: '8px',
    width: '80px',
    margin: '10px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
  },
  statusContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
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
  }),
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
  arrowButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#6b7280',
    padding: '4px',
    '&:disabled': {
      color: '#d1d5db',
      cursor: 'not-allowed',
    },
  },
};

export default QuestionStatus; 