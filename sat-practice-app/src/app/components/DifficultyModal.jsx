"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DifficultyModal({ isOpen, onClose, subject, title, mode = "quick", category = null, onDifficultySelected = null }) {
  const [selectedDifficulty, setSelectedDifficulty] = useState('mixed');
  const [questionCount, setQuestionCount] = useState(mode === "skill" ? 5 : 10); // Default to 5 for skills, 10 for others
  const router = useRouter();

  // Ensure question count doesn't exceed the max for the current mode
  const maxQuestions = mode === "skill" ? 7 : 20;
  const clampedQuestionCount = Math.min(questionCount, maxQuestions);

  // Clamp question count when mode changes
  useEffect(() => {
    if (questionCount > maxQuestions) {
      setQuestionCount(maxQuestions);
    }
  }, [mode, maxQuestions, questionCount]);

  if (!isOpen) return null;

  const handleDifficultySelect = (difficulty) => {
    setSelectedDifficulty(difficulty);
  };

  const handleStartPractice = () => {
    const finalQuestionCount = clampedQuestionCount;
    
    // If the parent provided a callback, use it
    if (onDifficultySelected) {
      onDifficultySelected(selectedDifficulty, finalQuestionCount);
      onClose();
      return;
    }
    
    // Otherwise, use the default behavior
    // Close the modal first
    onClose();
    
    // Force a small delay before navigation to ensure modal state is updated
    setTimeout(() => {
      // Build the URL based on the mode
      let url = `/practice?subject=${subject}&mode=${mode}&difficulty=${selectedDifficulty}&count=${finalQuestionCount}`;
      
      // Add category parameter if provided (for skill mode)
      if (category && mode === "skill") {
        url += `&category=${encodeURIComponent(category)}`;
      }
      
      console.log(`Navigating to: ${url}`);
      router.push(url);
    }, 100);
  };

  return (
    <div className="modal-overlay">
      <div className="difficulty-modal">
        <div className="modal-header">
          <h2>{title || "Select Difficulty Level"}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="difficulty-options">
          <div 
            className={`difficulty-option ${selectedDifficulty === 'easy' ? 'selected' : ''}`}
            onClick={() => handleDifficultySelect('easy')}
          >
            <div className="difficulty-icon easy">
              <span>1</span>
            </div>
            <div className="difficulty-details">
              <h3>Easy</h3>
              <p>Foundational concepts and straightforward problems</p>
            </div>
          </div>
          
          <div 
            className={`difficulty-option ${selectedDifficulty === 'medium' ? 'selected' : ''}`}
            onClick={() => handleDifficultySelect('medium')}
          >
            <div className="difficulty-icon medium">
              <span>2</span>
            </div>
            <div className="difficulty-details">
              <h3>Medium</h3>
              <p>Moderate complexity requiring deeper understanding</p>
            </div>
          </div>
          
          <div 
            className={`difficulty-option ${selectedDifficulty === 'hard' ? 'selected' : ''}`}
            onClick={() => handleDifficultySelect('hard')}
          >
            <div className="difficulty-icon hard">
              <span>3</span>
            </div>
            <div className="difficulty-details">
              <h3>Hard</h3>
              <p>Challenging problems that test advanced concepts</p>
            </div>
          </div>
          
          <div 
            className={`difficulty-option ${selectedDifficulty === 'mixed' ? 'selected' : ''}`}
            onClick={() => handleDifficultySelect('mixed')}
          >
            <div className="difficulty-icon mixed">
              <span>⟳</span>
            </div>
            <div className="difficulty-details">
              <h3>Mixed</h3>
              <p>Balanced selection from all difficulty levels</p>
            </div>
          </div>
        </div>
        
        <div className="question-count-section">
          <div className="question-count-header">
            <h3>Number of Questions</h3>
          </div>
          <div className="slider-container">
            <span className="slider-label">0</span>
            <div className="slider-wrapper">
              <input
                type="range"
                min="0"
                max={maxQuestions}
                value={clampedQuestionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className="question-slider"
              />
              <div 
                className="slider-value-display"
                style={{
                  left: `calc(${(clampedQuestionCount / maxQuestions) * 100}% - ${(clampedQuestionCount / maxQuestions) * 20}px + 10px)`
                }}
              >
                {clampedQuestionCount}
              </div>
            </div>
            <span className="slider-label">{mode === "skill" ? "7" : "20"}</span>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>Cancel</button>
          <button className="start-button" onClick={handleStartPractice}>
            Start Practice
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          font-family: 'Roboto', sans-serif;
        }
        
        .difficulty-modal {
          background-color: white;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #111827;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
          transition: color 0.2s ease, transform 0.2s ease;
        }
        
        .close-button:hover {
          color: #374151;
          transform: scale(1.1);
        }
        
        .difficulty-options {
          padding: 24px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .difficulty-option {
          display: flex;
          align-items: center;
          padding: 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .difficulty-option:hover {
          border-color: #4338ca;
          background-color: rgba(67, 56, 202, 0.05);
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .difficulty-option.selected {
          border-color: #4338ca;
          background-color: rgba(67, 56, 202, 0.1);
        }
        
        .difficulty-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-right: 16px;
          font-weight: bold;
          color: white;
          flex-shrink: 0;
          min-width: 40px;
          min-height: 40px;
          aspect-ratio: 1 / 1;
        }
        
        .difficulty-icon.easy {
          background-color: #10b981;
        }
        
        .difficulty-icon.medium {
          background-color: #f59e0b;
        }
        
        .difficulty-icon.hard {
          background-color: #ef4444;
        }
        
        .difficulty-icon.mixed {
          background-color: #6366f1;
        }
        
        .difficulty-details h3 {
          margin: 0 0 4px 0;
          font-size: 1rem;
          font-weight: 600;
        }
        
        .difficulty-details p {
          margin: 0;
          font-size: 0.875rem;
          color: #6b7280;
        }
        
        .question-count-section {
          padding: 20px 24px;
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          background-color: #f9fafb;
        }
        
        .question-count-header {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 32px;
        }
        
        .question-count-header h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
        }
        
        .slider-container {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .slider-wrapper {
          flex: 1;
          position: relative;
          height: 40px;
          display: flex;
          align-items: center;
        }
        
        .slider-label {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
          min-width: 20px;
          text-align: center;
        }
        
        .slider-value-display {
          position: absolute;
          top: -30px;
          transform: translateX(-50%);
          background-color: #4338ca;
          color: white;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          min-width: 24px;
          text-align: center;
          pointer-events: none;
          z-index: 10;
        }
        
        .slider-value-display::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 4px solid transparent;
          border-right: 4px solid transparent;
          border-top: 4px solid #4338ca;
        }
        
        .question-slider {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          outline: none;
          cursor: pointer;
          -webkit-appearance: none;
          appearance: none;
        }
        
        .question-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: #4338ca;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .question-slider::-webkit-slider-thumb:hover {
          background: #3730a3;
          transform: scale(1.1);
        }
        
        .question-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: #4338ca;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }
        
        .question-slider::-moz-range-thumb:hover {
          background: #3730a3;
          transform: scale(1.1);
        }
        
        .modal-footer {
          padding: 16px 24px;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          border-top: 1px solid #e5e7eb;
        }
        
        .cancel-button {
          padding: 8px 16px;
          background-color: white;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }
        
        .cancel-button:hover {
          background-color: #f9fafb;
          border-color: #9ca3af;
        }
        
        .start-button {
          padding: 8px 16px;
          background-color: #4338ca;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          color: white;
          cursor: pointer;
          transition: background-color 0.2s ease, transform 0.2s ease;
        }
        
        .start-button:hover {
          background-color: #3730a3;
          transform: translateY(-1px);
        }
        
        @media (max-width: 640px) {
          .difficulty-options {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
} 