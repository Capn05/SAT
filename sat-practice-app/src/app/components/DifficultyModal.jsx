"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DifficultyModal({ isOpen, onClose, subject }) {
  const [selectedDifficulty, setSelectedDifficulty] = useState('mixed');
  const router = useRouter();

  if (!isOpen) return null;

  const handleDifficultySelect = (difficulty) => {
    setSelectedDifficulty(difficulty);
  };

  const handleStartPractice = () => {
    router.push(`/practice?subject=${subject}&mode=quick&difficulty=${selectedDifficulty}`);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="difficulty-modal">
        <div className="modal-header">
          <h2>Select Difficulty Level</h2>
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
        }
        
        .start-button:hover {
          background-color: #3730a3;
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