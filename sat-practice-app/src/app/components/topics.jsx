import { BookOpen, Calculator, FlaskRoundIcon as Flask, PenTool } from "lucide-react"
import { Clock, ArrowRight } from "lucide-react"
import Link from 'next/link'

export default function TestCategories() {
  const categories = [
    { name: "Linear Equations", icon: Calculator, color: "#65a30d" },
    { name: "Reading", icon: BookOpen, color: "#65a30d" },
    { name: "Central ideas", icon: Flask, color: "#65a30d" },
    { name: "Words in Context", icon: PenTool, color: "#65a30d" },
  ]

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Targeted Practice</h2>
      <div style={styles.grid}>
        {categories.map((category) => {
          const Icon = category.icon
          return (
            <div key={category.name} style={styles.card}>
              <Icon style={{ ...styles.icon, color: category.color }} />
              <span style={styles.label}>{category.name}</span>
            </div>
          )
        })}
      </div>
      <Link href="/skills" style={styles.seeMoreText}>

      <div style={styles.seeMore}>
      All Skills<ArrowRight style={styles.arrowIcon} />
      </div>
      </Link>

    </div>
  )
}

const styles = {
  container: {
    padding: "20px",
  },
  title: {
    fontSize: "18px",
    fontWeight: 600,
    marginBottom: "16px",
    color: "#111827",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
    gap: "16px",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "16px",
    backgroundColor: "white", 
    borderRadius: "8px",
    cursor: "pointer",
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',

  },
  icon: {
    width: "24px",
    height: "24px",
    marginBottom: "8px",
  },
  label: {
    fontSize: "14px",
    color: "#374151",
  },
  seeMore: {
    display: "flex",
    alignItems: "center",
    justifyContent: "End",
    marginTop: "16px",
    cursor: "pointer",
    color: "#374151",
  },
  arrow: {
    marginRight: "8px",
    transform: "rotate(180deg)",
  },
  seeMoreText: {
    marginRight: "10px",
  },
}

