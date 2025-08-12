import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';

const QuickPracticeCompleteModal = ({ isOpen, onClose, subject, difficulty, mode, onMorePractice }) => {
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
          Great job completing this practice session! Would you like to practice more?
        </p>
        <div style={styles.buttonContainer}>
          <button 
            onClick={handleMorePractice} 
            style={styles.confirmButton}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#059669';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 12px -1px rgba(16, 185, 129, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#10b981';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(16, 185, 129, 0.2)';
            }}
          >
            More Practice
          </button>
          <button 
            onClick={handleImDone} 
            style={styles.cancelButton}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            I'm Done
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from { 
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to { 
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
    animation: 'fadeIn 0.2s ease-out',
  },
  modal: {
    backgroundColor: '#fff',
    padding: '32px',
    borderRadius: '16px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    textAlign: 'center',
    maxWidth: '500px',
    width: '90%',
    transform: 'scale(0.95)',
    animation: 'modalSlideIn 0.3s ease-out forwards',
    border: '1px solid #f1f5f9',
  },
  title: {
    margin: '0 0 12px',
    color: '#111827',
    fontSize: '28px',
    fontWeight: '700',
    letterSpacing: '-0.025em',
  },
  message: {
    margin: '0 0 32px',
    color: '#4b5563',
    fontSize: '16px',
    lineHeight: '1.6',
    fontWeight: '400',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  confirmButton: {
    padding: '14px 28px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    transform: 'translateY(0)',
    boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)',
  },
  cancelButton: {
    padding: '14px 28px',
    backgroundColor: '#f8fafc',
    color: '#475569',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    transform: 'translateY(0)',
  },
};

export default QuickPracticeCompleteModal; 