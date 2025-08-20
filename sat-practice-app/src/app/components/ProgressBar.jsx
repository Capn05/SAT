import React from "react"

const ProgressBar = ({ completed, total, showEarlySubmit = false, onEarlySubmit = null, mode = "quick" }) => {
  const percentage = Math.min(Math.round((completed / total) * 100), 100)

  return (
    <div style={styles.container}>
      <div style={styles.labelContainer}>
        <span style={styles.label}>Progress</span>
        <span style={styles.percentage}>{percentage}%</span>
      </div>
      <div style={styles.barContainer}>
        <div style={{ ...styles.progress, width: `${percentage}%` }} />
        <div style={styles.glow} />
      </div>
      <div style={styles.bottomContainer}>
        <div style={styles.textContainer}>
          <span style={styles.completedText}>{completed} /</span>
          <span style={styles.totalText}><span style={styles.completedText}>{total}</span>questions answered</span>
        </div>
        {showEarlySubmit && onEarlySubmit && (
          <button
            style={styles.earlySubmitButton}
            onClick={onEarlySubmit}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#f1f5f9";
              e.target.style.borderColor = "#cbd5e1";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#f8fafc";
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.transform = "translateY(0)";
            }}
          >
            Submit Module Early
          </button>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: {
    width: "100%",
    // maxWidth: "1600px",
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "20px 40px  20px 40px",
    boxShadow: "0 3px 6px rgba(0, 0, 0, 0.1)",
    fontFamily: "Arial, sans-serif",

  },
  labelContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  label: {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#374151",
  },
  percentage: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#4f46e5",
  },
  barContainer: {
    height: "12px",
    backgroundColor: "#e5e7eb",
    borderRadius: "6px",
    overflow: "hidden",
    position: "relative",
  },
  progress: {
    height: "100%",
    backgroundColor: "#4f46e5",
    borderRadius: "6px",
    transition: "width 0.5s ease-in-out",
  },
  glow: {
    position: "absolute",
    top: "0",
    left: "0",
    height: "100%",
    width: "5px",
    background: "rgba(255, 255, 255, 0.3)",
    filter: "blur(3px)",
    animation: "glow 1.5s infinite",
  },
  bottomContainer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "10px",
  },
  textContainer: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  completedText: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#4f46e5",
    marginRight: "8px",
  },
  totalText: {
    fontSize: "14px",
    color: "#6b7280",
  },
  earlySubmitButton: {
    padding: "8px 16px",
    backgroundColor: "#f8fafc",
    color: "#475569",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s ease",
    boxShadow: "none",
  },
}

export default ProgressBar

