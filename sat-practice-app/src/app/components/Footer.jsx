import { Heart } from "lucide-react"

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.content}>
        <p style={styles.text}>© 2025 Brill. All rights reserved.</p>
        <div style={styles.links}>
          <a href="/terms" style={styles.link}>
            Terms of Service
          </a>
          <a href="/privacy" style={styles.link}>
            Privacy Policy
          </a>
          <a href="/contact" style={styles.link}>
            Contact Us
          </a>
        </div>
      </div>
      <div style={styles.love}>
        <span>Made with </span>
        <Heart style={styles.heartIcon} />
        <span> by the Brill Team</span>
      </div>
    </footer>
  )
}

const styles = {
  footer: {
    backgroundColor: "#f9fafb",
    borderTop: "1px solid #e5e7eb",
    padding: "24px",
    marginTop: "100px",
  },
  content: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    maxWidth: "1200px",
    margin: "0 auto",
    flexWrap: "wrap",
  },
  text: {
    color: "#4b5563",
    fontSize: "14px",
  },
  links: {
    display: "flex",
    gap: "16px",
  },
  link: {
    color: "#4b5563",
    fontSize: "14px",
    textDecoration: "none",
  },
  love: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "16px",
    color: "#4b5563",
    fontSize: "14px",
  },
  heartIcon: {
    color: "#ef4444",
    width: "16px",
    height: "16px",
    margin: "0 4px",
  },
}

