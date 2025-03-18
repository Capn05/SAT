import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';

const QuickPracticeCompleteModal = ({ isOpen, onClose, subject, difficulty, mode }) => {
  const router = useRouter();

  // Use useCallback to memoize the handlers
  const handleStartNewPractice = useCallback(() => {
    // First close the modal
    onClose();
    // Then navigate to a new quick practice session with the same parameters
    const url = `/practice?mode=${mode || 'quick'}&subject=${subject}&difficulty=${difficulty || 'mixed'}`;
    console.log('Navigating to:', url);
    router.push(url);
  }, [router, onClose, mode, subject, difficulty]);

  const handleReturnHome = useCallback(() => {
    // First close the modal
    onClose();
    // Then navigate to home
    router.push('/home');
  }, [router, onClose]);
  
  // Conditional return after all hook declarations
  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Practice Completed!</h2>
        <p style={styles.message}>
          Great job completing this practice session! Would you like to start a new practice of the same type?
        </p>
        <div style={styles.buttonContainer}>
          <button onClick={handleStartNewPractice} style={styles.confirmButton}>
            Start New Practice
          </button>
          <button onClick={handleReturnHome} style={styles.cancelButton}>
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    textAlign: 'center',
    maxWidth: '500px',
    width: '90%',
  },
  title: {
    margin: '0 0 16px',
    color: '#1f2937',
    fontSize: '24px',
    fontWeight: '600',
  },
  message: {
    margin: '0 0 24px',
    color: '#4b5563',
    fontSize: '16px',
    lineHeight: '1.5',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  confirmButton: {
    padding: '12px 24px',
    backgroundColor: '#65a30d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#4d7c0f',
    },
  },
  cancelButton: {
    padding: '12px 24px',
    backgroundColor: '#f3f4f6',
    color: '#1f2937',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#e5e7eb',
    },
  },
};

export default QuickPracticeCompleteModal; 