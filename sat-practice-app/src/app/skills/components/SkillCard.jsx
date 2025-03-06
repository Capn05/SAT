import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import DifficultyModal from '../../components/DifficultyModal';

const masteryColors = {
  'Mastered': '#22c55e',
  'On Track': '#65a30d',
  'Needs Practice': '#dc2626',
  'Not Started': '#6b7280',
  'Needs More Attempts': '#f59e0b'
};

export default function SkillCard({ skill, subject }) {
  const router = useRouter();
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);

  const handleClick = () => {
    // Show difficulty modal instead of navigating directly
    setShowDifficultyModal(true);
  };

  const handleDifficultyModalClose = () => {
    setShowDifficultyModal(false);
  };

  // Determine the subject ID based on the subject prop
  const subjectId = subject === "Math" ? "1" : "4";

  return (
    <>
      <div
        style={{
          ...styles.card,
          borderLeft: `3px solid ${masteryColors[skill.mastery] || masteryColors['Not Started']}`
        }}
        onClick={handleClick}
      >
        <div style={styles.header}>
          <div style={styles.iconContainer}>{skill.icon}</div>
          <h3 style={styles.title}>{skill.name}</h3>
        </div>
        <div style={styles.stats}>
          <div style={styles.stat}>
            <span style={styles.label}>Accuracy:</span>
            <span style={styles.value}>{skill.accuracy}%</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.label}>Last Practice:</span>
            <span style={styles.value}>{skill.lastPracticed}</span>
          </div>
          <div style={styles.stat}>
            <span style={styles.label}>Status:</span>
            <span style={{
              ...styles.value,
              color: masteryColors[skill.mastery] || masteryColors['Not Started'],
              fontWeight: 600
            }}>
              {skill.mastery}
            </span>
          </div>
        </div>
        <div style={styles.footer}>
          <span style={styles.practiceText}>Practice Now</span>
          <ArrowRight size={16} />
        </div>
      </div>

      {/* Use the updated DifficultyModal component */}
      <DifficultyModal 
        isOpen={showDifficultyModal} 
        onClose={handleDifficultyModalClose} 
        subject={subjectId}
        title={`Select Difficulty Level for ${skill.name}`}
        mode="skill"
        category={skill.name}
      />
    </>
  );
}

const styles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
  },
  title: {
    fontSize: '16px',
    fontWeight: 500,
    color: '#111827',
    margin: 0,
  },
  stats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  stat: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: '14px',
    color: '#6b7280',
  },
  value: {
    fontSize: '14px',
    color: '#111827',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '16px',
    color: '#4f46e5',
  },
  practiceText: {
    fontSize: '14px',
    fontWeight: 500,
  },
  
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  difficultyModal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '600px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#111827',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
  },
  difficultyOptions: {
    padding: '24px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  difficultyOption: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    border: '2px solid',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  difficultyIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '16px',
    fontWeight: 'bold',
    color: 'white',
    flexShrink: 0,
  },
  difficultyDetails: {
    flex: 1,
  },
  difficultyTitle: {
    margin: '0 0 4px 0',
    fontSize: '1rem',
    fontWeight: 600,
  },
  difficultyDescription: {
    margin: 0,
    fontSize: '0.875rem',
    color: '#6b7280',
  },
};

