import { Clock, ArrowRight } from "lucide-react"
import Link from "next/link"
export default function TimedTestButton() {
  return (
    <div 
      style={styles.container}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        // e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.1)';
      }}
    >
      <Link href="/TimedTestDash" style={styles.backLink}>
        <button 
          style={styles.button} 
          onClick={() => console.log("Navigate to timed test")}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#3730a3';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#4338ca';
          }}
        >
          <div style={styles.iconWrapper}>
            <Clock style={styles.icon} />
          </div>

          <div style={styles.textContent}>
            
            <h3 style={styles.title}> Practice Test</h3>
            <p style={styles.description}>Challenge yourself with a full-length, timed PSAT practice exam</p>
          </div>
          <ArrowRight style={styles.arrowIcon} />
        </button>
      </Link>

    </div>
  )
}

const styles = {
  container: {
    padding: "20px",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    cursor: "pointer",
  },
  button: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "16px",
    backgroundColor: "#4338ca",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  iconWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: "50%",
    marginRight: "16px",
  },
  icon: {
    width: "24px",
    height: "24px",
  },
  textContent: {
    flex: 1,
    textAlign: "left",
  },
  title: {
    fontSize: "18px",
    fontWeight: 600,
    marginBottom: "4px",
  },
  description: {
    fontSize: "14px",
    opacity: 0.8,
  },
  arrowIcon: {
    width: "24px",
    height: "24px",
    marginLeft: "16px",
  },
}

