export default function SubjectTabs({ activeSubject, onSubjectChange }) {
    return (
      <div style={styles.container}>
        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              ...(activeSubject === "math" ? styles.activeTab : {}),
            }}
            onClick={() => onSubjectChange("math")}
          >
            Mathematics
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeSubject === "reading" ? styles.activeTab : {}),
            }}
            onClick={() => onSubjectChange("reading")}
          >
            Reading & Writing
          </button>
        </div>
        <div style={styles.info}>
          <h2 style={styles.infoTitle}>Understanding Domains and Skills</h2>
          <p style={styles.infoText}>
            The SAT is organized into <strong>domains</strong> (major subject areas) and <strong>skills</strong> (specific
            abilities tested within each domain). Each domain shows its approximate distribution of questions on the test.
            Click on any skill to start practicing questions specifically targeted to that area.
          </p>
        </div>
      </div>
    )
  }
  
  const styles = {
    container: {
      padding: "24px",
      borderBottom: "1px solid #e5e7eb",
      backgroundColor: "white",
    },
    tabs: {
      display: "flex",
      gap: "12px",
      marginBottom: "24px",
    },
    tab: {
      padding: "12px 24px",
      border: "none",
      borderRadius: "8px",
      fontSize: "16px",
      fontWeight: 500,
      cursor: "pointer",
      backgroundColor: "#f3f4f6",
      color: "#6b7280",
      transition: "all 0.2s ease",
    },
    activeTab: {
      backgroundColor: "#4338ca",
      color: "white",
    },
    info: {
      backgroundColor: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      padding: "16px",
    },
    infoTitle: {
      fontSize: "16px",
      fontWeight: 600,
      color: "#1e293b",
      marginBottom: "8px",
    },
    infoText: {
      fontSize: "14px",
      lineHeight: "1.5",
      color: "#475569",
    },
  }
  
  