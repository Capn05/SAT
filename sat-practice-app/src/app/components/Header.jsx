import { UserCircle } from "lucide-react"

export default function Header() {
  return (
    <div style={styles.header}>
      <h1 style={styles.title}>Dashboard</h1>
      <div style={styles.profile}>
        <UserCircle style={styles.avatar} />
      </div>
    </div>
  )
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px",
    borderBottom: "1px solid #e5e7eb",
    backgroundColor: "white",
  },
  title: {
    fontSize: "24px",
    fontWeight: 600,
    color: "#111827",
  },
  profile: {
    display: "flex",
    alignItems: "center",
  },
  avatar: {
    width: "40px",
    height: "40px",
    color: "#65a30d",
  },
}

