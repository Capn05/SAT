import { InfoIcon } from "lucide-react"
import Link from 'next/link';

export default function SubjectSection({ title, value, buttonText, subject_id }) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.sectionTitle}>{title}</span>


        
      </div>
      <div style={styles.content}>
        <span style={styles.value}>{value}</span>
      </div>
      <Link href={{ pathname: '/questions', query: { subject: subject_id, mode: 'quick' } }} style={styles.button}>
        {buttonText}    
      </Link>
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
  },
  value: {
    fontSize: "24px",
    fontWeight: 600,
    color: "#111827",
  },
  button: {
    width: "100%",
    padding: "8px",
    backgroundColor: "#e6f0e6",
    border: "none",
    borderRadius: "4px",
    color: "#065f46",
    cursor: "pointer",
    fontSize: "14px",
  },
}

