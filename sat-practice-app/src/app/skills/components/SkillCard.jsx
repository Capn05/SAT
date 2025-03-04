import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const masteryColors = {
  'Mastered': '#22c55e',
  'On Track': '#65a30d',
  'Needs Practice': '#dc2626',
  'Not Started': '#6b7280',
  'Needs More Attempts': '#f59e0b'
};

export default function SkillCard({ skill, subject }) {
  const router = useRouter();

  const handleClick = () => {
    // Determine the subject ID based on the subject prop
    const subjectId = subject === "Math" ? "1" : "4";
    
    console.log('Navigating to skill practice:', skill.name);
    const url = `/practice?mode=skill&subject=${subjectId}&category=${encodeURIComponent(skill.name)}`;
    console.log('Navigation URL:', url);
    router.push(url);
  };

  return (
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
};

