"use client"
import Header from "../components/Header"
import SubjectSection from "../components/SubjectSection"
import WeeklyTrack from "../components/WeeklyTrack"
import TestCategories from "../components/topics"
import { useAuth } from '../../../lib/AuthProvider'; // Use the new auth provider
import AIChat from "../components/AIChatGeneral"
import AnalyticsCard from "../components/AnalyticsCard"
import Footer from "../components/Footer"
import TimedTestButton from "../components/TimedPractice"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '../components/TopBar';
import DifficultyModal from '../components/DifficultyModal';

export default function Dashboard() {
  // Use the new centralized auth context
  const { user, loading } = useAuth();
  
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [localLoading, setLocalLoading] = useState(true);
  const router = useRouter();

  // Add a safety timeout to prevent infinite loading
  useEffect(() => {
    // Update local loading state when auth loading changes
    setLocalLoading(loading);
    
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn("Dashboard loading timed out after 7 seconds");
        setLocalLoading(false);
      }
    }, 7000);
    
    return () => clearTimeout(timeout);
  }, [loading]);

  const handleStartPractice = (subject) => {
    setSelectedSubject(subject);
    setShowDifficultyModal(true);
  };

  // Show loading state while auth is being checked
  if (localLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <div style={styles.loadingText}>Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Header />
      <div style={styles.content}>
        <div style={styles.grid}>
          <div style={styles.leftColumn}>
            <div style={styles.subjects}>
              <SubjectSection 
                title="Quick Practice" 
                value="Math Section" 
                buttonText="Start Practice" 
                subject_id="1" 
                onStartPractice={handleStartPractice}
              />
              <SubjectSection 
                title="Quick Practice" 
                value="Reading & Writing Section" 
                buttonText="Start Practice" 
                subject_id="2" 
                onStartPractice={handleStartPractice}
              />
            </div>
            <TimedTestButton/>

            <div style={styles.analytics}>
              <TestCategories />
            </div>
          </div>
          <div style={styles.rightColumn}>
          <AnalyticsCard />
          <AIChat/>
          </div>
        </div>
      </div>
      <Footer />

      {/* Difficulty selection modal */}
      <DifficultyModal 
        isOpen={showDifficultyModal} 
        onClose={() => setShowDifficultyModal(false)}
        subject={selectedSubject}
      />
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
    margin:"0 1vh  0 1vh",
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
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f9fafb",
  },
  loadingSpinner: {
    border: "4px solid rgba(0, 0, 0, 0.1)",
    borderTop: "4px solid #4b5563",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    fontSize: "18px",
    color: "#4b5563",
  }
}

// Add a global style for the spinner animation
const spinnerStyle = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

if (typeof document !== 'undefined') {
  // Only run in browser environment
  const style = document.createElement('style');
  style.innerHTML = spinnerStyle;
  document.head.appendChild(style);
}

