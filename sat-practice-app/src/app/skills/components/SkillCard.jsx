import { TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from 'next/navigation';

export default function SkillCard({ skill }) {
  const router = useRouter();

  const handleSkillClick = (skill) => {
    router.push(`/skillDetails?page=${skill.name}`); // or use skill.id if you have an ID
  };
  console.log(`"skill:" + ${skill.name}`)
  return (
    <div style={styles.container} onClick={() => handleSkillClick(skill)}>
      <div style={styles.header}>
        <div style={styles.iconContainer}>{skill.icon}</div>
        <div style={styles.headerText}>
          <h3 style={styles.title}>{skill.name}</h3>
          <span
            style={{
              ...styles.status,
              color: skill.needsPractice ? "#ef4444" : "#65a30d",
            }}
          >
            {skill.needsPractice ? (
              <>
                <AlertCircle size={14} />
                Needs Practice
              </>
            ) : (
              <>
                <CheckCircle size={14} />
                On Track
              </>
            )}
          </span>
        </div>
      </div>

      <div style={styles.stats}>
        <div style={styles.stat}>
          <TrendingUp size={16} />
          <span>{skill.accuracy}% Accuracy</span>
        </div>
        <div style={styles.stat}>
          <Clock size={16} />
          <span>Last practiced {skill.lastPracticed}</span>
        </div>
      </div>

      <div style={styles.progressContainer}>
        <div style={styles.progressBar}>
          <div
            style={{
              ...styles.progress,
              width: `${skill.progress}%`,
              backgroundColor: skill.needsPractice ? "#ef4444" : "#65a30d",
            }}
          />
        </div>
        <span style={styles.progressText}>{skill.progress}% Mastery</span>
      </div>
    </div>
  )
}

const styles = {
  container: {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    cursor: "pointer",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "16px",
  },
  iconContainer: {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    backgroundColor: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#111827",
    marginBottom: "4px",
  },
  status: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "14px",
  },
  stats: {
    display: "flex",
    gap: "16px",
    marginBottom: "16px",
  },
  stat: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#6b7280",
    fontSize: "14px",
  },
  progressContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  progressBar: {
    flex: 1,
    height: "6px",
    backgroundColor: "#f3f4f6",
    borderRadius: "3px",
    overflow: "hidden",
  },
  progress: {
    height: "100%",
    transition: "width 0.3s ease",
  },
  progressText: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#374151",
    minWidth: "80px",
  },
}

