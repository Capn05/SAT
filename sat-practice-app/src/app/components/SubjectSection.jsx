import { InfoIcon } from "lucide-react"
import { useContext } from 'react'

export default function SubjectSection({ title, value, buttonText, subject_id, onStartPractice }) {
  return (
    <div 
      style={styles.container}
      onClick={() => onStartPractice(subject_id)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        // e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        // e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.1)';
      }}
    >
      <div style={styles.header}>
        <span style={styles.sectionTitle}>{title}</span>
      </div>
      <div style={styles.content}>
        <span style={styles.value}>{value}</span>
      </div>
      <div style={styles.buttonContainer}>
        <button 
          style={styles.button}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#0d9768';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#10b981';
          }}
        >
          {buttonText}    
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: "20px",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
    display: "flex",
    flexDirection: "column",
    minHeight: "200px", // Set minimum height to ensure consistent card size
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: "pointer",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  sectionTitle: {
    fontSize: "16px",
    color: "#4b5563",
  },
  icon: {
    width: "20px",
    height: "20px",
    color: "#65a30d",
  },
  content: {
    marginBottom: "16px",
    flex: 1, // Takes up remaining space
  },
  value: {
    fontSize: "24px",
    fontWeight: 600,
    color: "#111827",
  },
  buttonContainer: {
    marginTop: "auto", // Pushes button to bottom
  },
  button: {
    backgroundColor: "#10b981",
    color: "white", 
    padding: "0.5rem 1.25rem",
    borderRadius: "0.375rem",
    fontWeight: 500,
    width: "100%",
    border: "none",
    cursor: "pointer",
    textAlign: "center",
    textDecoration: "none",
    display: "inline-block",
    transition: "background-color 0.2s ease",
  },
}
