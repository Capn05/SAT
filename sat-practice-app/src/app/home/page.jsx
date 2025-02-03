"use client"
import Header from "../components/Header"
import SubjectSection from "../components/SubjectSection"
import WeeklyTrack from "../components/WeeklyTrack"
import TestCategories from "../components/topics"
import useAuth from '../../../lib/useAuth'; // Adjust the path as necessary
import AIChat from "../components/AIChatGeneral"
import AnalyticsCard from "../components/AnalyticsCard"
import Footer from "../components/Footer"
import TimedTestButton from "../components/TimedPractice"


export default function Dashboard() {
  useAuth()

  return (
    <div style={styles.container}>
      <Header />
      <div style={styles.content}>
        <div style={styles.grid}>
          <div style={styles.leftColumn}>
            <div style={styles.subjects}>
              <SubjectSection title="Quick Practice" value="Math Section" buttonText="Start Practice" subject_id="1" />
              <SubjectSection title="Quick Practice" value="Reading/Writing Section" buttonText="Start Practice" subject_id="2" />
            </div>
            <TimedTestButton/>

            <div style={styles.analytics}>
              <TestCategories />
            </div>
            <AnalyticsCard />
          </div>
          <div style={styles.rightColumn}>
            <WeeklyTrack />
            <AIChat/>
          </div>
        </div>
      </div>
      <Footer />

    </div>
  )
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f9fafb",

  },
  content: {
    padding: "24px",
    margin:"0 5vh  0 5vh",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
  },
  leftColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  subjects: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
  },
  analytics: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
  },
  rightColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
}

