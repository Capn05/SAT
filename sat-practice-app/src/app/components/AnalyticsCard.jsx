import { BarChart2, TrendingUp, CheckCircle, XCircle } from "lucide-react"

export default function AnalyticsCard() {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Your Progress</h2>
      </div>

      <div style={styles.stats}>
        <div style={styles.stat}>
          <div style={styles.statIcon}>
            <CheckCircle style={{ color: "#65a30d", width: 20, height: 20 }} />
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>247</div>
            <div style={styles.statLabel}>Questions Completed</div>
          </div>
        </div>

        <div style={styles.stat}>
          <div style={styles.statIcon}>
            <TrendingUp style={{ color: "#65a30d", width: 20, height: 20 }} />
          </div>
          <div style={styles.statInfo}>
            <div style={styles.statValue}>76%</div>
            <div style={styles.statLabel}>Accuracy Rate</div>
          </div>
        </div>
      </div>

      <button style={styles.viewButton}>
        <BarChart2 style={styles.buttonIcon} />
        <span>View Detailed Analytics</span>
      </button>
    </div>
  )
}

const styles = {
  container: {
    padding: "20px",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
  },
  header: {
    marginBottom: "20px",
  },
  title: {
    fontSize: "16px",
    fontWeight: 500,
    color: "#4b5563",
  },
  stats: {
    display: "flex",
    gap: "24px",
    marginBottom: "24px",
  },
  stat: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  statIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    backgroundColor: "#f3f9f3",
    borderRadius: "8px",
  },
  statInfo: {
    display: "flex",
    flexDirection: "column",
  },
  statValue: {
    fontSize: "24px",
    fontWeight: 600,
    color: "#111827",
  },
  statLabel: {
    fontSize: "14px",
    color: "#6b7280",
  },
  viewButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px",
    backgroundColor: "#e6f0e6",
    border: "none",
    borderRadius: "8px",
    color: "#10b981",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
  },
  buttonIcon: {
    width: "16px",
    height: "16px",
  },
}

