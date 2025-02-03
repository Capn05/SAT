"use client"
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

const QuestionStatus = ({ currentIndex, totalQuestions, fetchUserAnswers, onSelectQuestion, questions }) => {
  const [userAnswers, setUserAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const questionsPerPage = 10;

  // Calculate the index of the first and last question to display
  const startIndex = currentPage * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const displayedQuestions = questions.slice(startIndex, endIndex);

  const totalPages = Math.ceil(questions.length / questionsPerPage);

  useEffect(() => {
    const fetchUserAnswersData = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        console.error('Error fetching user:', error);
        setLoading(false);
        return;
      }

      if (!user) {
        console.error('No user is logged in');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('user_answers')
        .select('question_id, is_correct')
        .eq('user_id', user.id);

      if (fetchError) {
        console.error('Error fetching user answers:', fetchError);
      } else {
        console.log('Fetched user answers:', data);
        setUserAnswers(data);
      }
      setLoading(false);
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
    padding: '20px',
    borderRadius: '12px',
    margin: '10px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  },
  statusContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  circle: (status, isSelected) => ({
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: status === 'correct' ? '#65a30d' : status === 'incorrect' ? '#f8d7da' : 'grey',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    boxShadow: isSelected ? '0 0 10px rgba(0, 0, 0, 0.5)' : 'none',
    border: isSelected ? '1px solid black' : '0',
  }),
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '10px',
  },
  arrowButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: 'black',
  },
};

export default QuestionStatus; 