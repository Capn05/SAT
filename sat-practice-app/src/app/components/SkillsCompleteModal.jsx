import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';

const SkillsCompleteModal = ({ isOpen, onClose, subject, skillName, mode, difficulty, onMorePractice }) => {
  const router = useRouter();

  const handleMorePractice = useCallback(() => {
    // Close this modal
    onClose();
    
    // Call the parent's handler
    if (onMorePractice) {
      onMorePractice();
    }
  }, [onClose, onMorePractice]);

  const handleImDone = useCallback(() => {
    // First close the modal
    onClose();
    
    // Then navigate back to the skills page for the specific subject
    // Use the subject ID from props, ensuring it's passed as a query parameter
    const url = `/skills?subject=${subject}`;
    console.log('Navigating to:', url);
    router.push(url);
  }, [router, onClose, subject]);
  
  // Conditional return after all hook declarations
  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Skill Practice Completed!</h2>
        <p style={styles.message}>
          Great job completing this skill practice! Would you like to practice more?
        </p>
        <div style={styles.buttonContainer}>
          <button onClick={handleMorePractice} style={styles.confirmButton}>
            More Practice
          </button>
          <button onClick={handleImDone} style={styles.cancelButton}>
            I'm Done
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
  difficultySection: {
    marginBottom: '24px',
    textAlign: 'left',
  },
  difficultyLabel: {
    fontWeight: '500',
    marginBottom: '12px',
    color: '#4b5563',
    fontSize: '16px',
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: '6px',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#f3f4f6',
    },
  },
  radioInput: {
    marginRight: '12px',
  },
  radioText: {
    fontSize: '16px',
    color: '#1f2937',
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
  secondaryButton: {
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

export default SkillsCompleteModal; 