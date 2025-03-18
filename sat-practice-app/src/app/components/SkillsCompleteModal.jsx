import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const SkillsCompleteModal = ({ isOpen, onClose, subject, skillName, mode, difficulty }) => {
  const router = useRouter();
  const [selectedDifficulty, setSelectedDifficulty] = useState(difficulty || 'mixed');
  const [showDifficultyOptions, setShowDifficultyOptions] = useState(false);

  const handleReturnToSkills = useCallback(() => {
    // First close the modal
    onClose();
    // Then navigate back to the skills page for the specific subject
    const url = `/skills?subject=${subject}`;
    console.log('Navigating to:', url);
    router.push(url);
  }, [router, onClose, subject]);

  const handlePracticeMore = useCallback(() => {
    if (showDifficultyOptions) {
      // First close the modal
      onClose();
      // Then start new practice with selected difficulty
      const url = `/practice?mode=${mode || 'skill'}&subject=${subject}&category=${encodeURIComponent(skillName)}&difficulty=${selectedDifficulty}`;
      console.log('Navigating to:', url);
      router.push(url);
    } else {
      // Show difficulty selection options
      setShowDifficultyOptions(true);
    }
  }, [router, onClose, showDifficultyOptions, mode, subject, skillName, selectedDifficulty]);

  const handleDifficultyChange = useCallback((e) => {
    setSelectedDifficulty(e.target.value);
  }, []);
  
  // Conditional return after all hook declarations
  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Skill Practice Completed!</h2>
        <p style={styles.message}>
          Great job completing this skill practice! What would you like to do next?
        </p>
        
        {showDifficultyOptions ? (
          <div style={styles.difficultySection}>
            <p style={styles.difficultyLabel}>Select difficulty for next practice:</p>
            <div style={styles.radioGroup}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="difficulty"
                  value="easy"
                  checked={selectedDifficulty === 'easy'}
                  onChange={handleDifficultyChange}
                  style={styles.radioInput}
                />
                <span style={styles.radioText}>Easy</span>
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="difficulty"
                  value="medium"
                  checked={selectedDifficulty === 'medium'}
                  onChange={handleDifficultyChange}
                  style={styles.radioInput}
                />
                <span style={styles.radioText}>Medium</span>
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="difficulty"
                  value="hard"
                  checked={selectedDifficulty === 'hard'}
                  onChange={handleDifficultyChange}
                  style={styles.radioInput}
                />
                <span style={styles.radioText}>Hard</span>
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="difficulty"
                  value="mixed"
                  checked={selectedDifficulty === 'mixed'}
                  onChange={handleDifficultyChange}
                  style={styles.radioInput}
                />
                <span style={styles.radioText}>Mixed</span>
              </label>
            </div>
          </div>
        ) : null}

        <div style={styles.buttonContainer}>
          {showDifficultyOptions ? (
            <button onClick={handlePracticeMore} style={styles.confirmButton}>
              Start Practice
            </button>
          ) : (
            <button onClick={handlePracticeMore} style={styles.confirmButton}>
              Practice More
            </button>
          )}
          <button onClick={handleReturnToSkills} style={styles.cancelButton}>
            Return to Skills
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