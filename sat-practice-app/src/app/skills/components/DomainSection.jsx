export default function DomainSection({ domain, children }) {
  return (
    <div style={styles.container}>
      <div style={styles.domainHeader}>
        <div style={styles.headerContent}>
          <h2 style={styles.domainTitle}>{domain.name}</h2>
          <div style={styles.distribution}>
            <div style={styles.distributionBox}>
              <span style={styles.distributionLabel}>Distribution</span>
              <span style={styles.distributionValue}>{domain.distribution}</span>
            </div>
            <div style={styles.questionBox}>
              <span style={styles.questionLabel}>Questions</span>
              <span style={styles.questionValue}>{domain.questions}</span>
            </div>
          </div>
        </div>
      </div>
      <div style={styles.skillsGrid}>{children}</div>
    </div>
  )
}

const styles = {
  container: {
    marginBottom: "32px",
    backgroundColor: "white",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  domainHeader: {
    backgroundColor: "#4338ca",
    padding: "5px 24px",
  },
  headerContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16x",
  },
  domainTitle: {
    fontSize: "20px",
    fontWeight: 600,
    color: "white",
    margin: 0,
  },
  distribution: {
    display: "flex",
    gap: "16px",
  },
  distributionBox: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: "8px 16px",
    borderRadius: "6px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  questionBox: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: "8px 16px",
    borderRadius: "6px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  distributionLabel: {
    fontSize: "12px",
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: "4px",
  },
  distributionValue: {
    fontSize: "16px",
    fontWeight: 600,
    color: "white",
  },
  questionLabel: {
    fontSize: "12px",
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: "4px",
  },
  questionValue: {
    fontSize: "16px",
    fontWeight: 600,
    color: "white",
  },
  skillsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
    padding: "24px",
    backgroundColor: "white",
  },
}

