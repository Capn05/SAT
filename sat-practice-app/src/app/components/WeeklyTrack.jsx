export default function WeeklyTrack() {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    const values = [0.8, 0.6, 0.9, 0.7, 0.5, 0.3, 0.4] // Example values between 0 and 1
  
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.title}>Track</span>
          <select style={styles.select}>
            <option>Details ›</option>
          </select>
        </div>
        <div style={styles.graph}>
          {values.map((value, index) => (
            <div key={index} style={styles.bar}>
              <div
                style={{
                  ...styles.barFill,
                  height: `${value * 100}%`,
                }}
              />
              <span style={styles.dayLabel}>{days[index]}</span>
            </div>
          ))}
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
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
    },
    title: {
      fontSize: "16px",
      color: "#4b5563",
    },
    select: {
      border: "none",
      color: "#65a30d",
      backgroundColor: "transparent",
      cursor: "pointer",
    },
    graph: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      height: "200px",
      padding: "20px 0",
    },
    bar: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: "30px",
    },
    barFill: {
      width: "100%",
      backgroundColor: "#65a30d",
      borderRadius: "4px",
      marginBottom: "8px",
    },
    dayLabel: {
      fontSize: "12px",
      color: "#6b7280",
    },
  }
  
  