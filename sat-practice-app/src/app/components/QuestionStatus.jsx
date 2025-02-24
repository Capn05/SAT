"use client"
import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

const QuestionStatus = ({ currentIndex, totalQuestions, fetchUserAnswers, onSelectQuestion, questions }) => {
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

  const getStatus = (questionId) => {
    const answer = userAnswers.find((ans) => ans.question_id === questionId);
    if (answer) {
      return answer.is_correct ? 'correct' : 'incorrect';
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
          const isSelected = index === currentIndex;
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
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    width: '80px',
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
    outline: isSelected ? '3px solid #3b82f6' : 'none',
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