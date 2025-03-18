"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, BookOpen, Brain, TrendingUp, Clock, CheckCircle, AlertCircle, RotateCcw, Play } from "lucide-react"
import { readingDomains } from '../skills/domains'; // Import readingDomains
import Link from 'next/link'

// Extract skills data from readingDomains
const skillsData = readingDomains.flatMap(domain => domain.skills);

async function getSkillData(skillName) {
  // Simulate an API call or data fetching
  return new Promise((resolve) => {
    const skill = skillsData.find((s) => s.name === skillName);
    setTimeout(() => resolve(skill), 500); // Simulate network delay
  });
}

// Create a client component for the content
function SkillDetailsContent() {
  const searchParams = useSearchParams()
  const skillName = searchParams.get('page')
  const [skill, setSkill] = useState(null)
  const [activeTab, setActiveTab] = useState("overview")
  const router = useRouter()

  useEffect(() => {
    const fetchSkillData = async () => {
      const skillData = await getSkillData(skillName)
      setSkill(skillData)
    }

    if (skillName) {
      fetchSkillData()
    }
  }, [skillName])

  if (!skill) {
    return <div>Loading...</div>
  }
console.log(skill.name)
  return (
    <div style={styles.container}>
      <header style={styles.header}>
      <Link href="/skills" style={styles.seeMoreText}>

        <button style={styles.backButton} >

          <ArrowLeft size={20} />

          <span>Back to Skills</span>
        </button>
        </Link>

      </header>

      <div style={styles.content}>
        <div style={styles.statsCard}>
        <h1 style={styles.title}>{skill.name}</h1>

          <div style={styles.iconContainer}>{skill.icon}</div>
          
          <div style={styles.stats}>
            <div style={styles.stat}>
              <TrendingUp size={16} />
              <span>{skill.accuracy}% Accuracy</span>
            </div>
            <div style={styles.stat}>
              <Clock size={16} />
              <span>Last practiced {skill.lastPracticed}</span>
            </div>
            <div style={styles.stat}>
              <span
                style={{
                  ...styles.status,
                  color: skill.needsPractice ? "#ef4444" : "#65a30d",
                }}
              >
                {skill.needsPractice ? (
                  <>
                    <AlertCircle size={14} />
                    Needs Practice
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} />
                    On Track
                  </>
                )}
              </span>
            </div>
          </div>
          <div style={styles.progressContainer}>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progress,
                  width: `${skill.progress}%`,
                  backgroundColor: skill.needsPractice ? "#ef4444" : "#65a30d",
                }}
              />
            </div>
            <span style={styles.progressText}>{skill.progress}% Mastery</span>
          </div>
        </div>

        <div style={styles.tabContainer}>
            
          <button
            style={{ ...styles.tab, ...(activeTab === "overview" ? styles.activeTab : {}) }}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab === "practice" ? styles.activeTab : {}) }}
            onClick={() => setActiveTab("practice")}
          >
            Practice
          </button>
          <button
            style={{ ...styles.tab, ...(activeTab === "review" ? styles.activeTab : {}) }}
            onClick={() => setActiveTab("review")}
          >
            Review
          </button>

        </div>

        {activeTab === "overview" && (
          <div style={styles.overviewContent}>
            <h2 style={styles.sectionTitle}>Skill Overview</h2>
            <p style={styles.overviewText}>
              {skill.description ||
                `${skill.name} is an important skill in the SAT. 
              Focus on improving your understanding and application of this concept to boost your overall performance.`}
            </p>
            <h3 style={styles.subTitle}>Tips to Improve</h3>
            <ul style={styles.tipsList}>
              <li>Practice regularly with a variety of question types</li>
              <li>Review your mistakes and understand why you made them</li>
              <li>Use official SAT study materials to familiarize yourself with the test format</li>
              <li>Time yourself when practicing to improve your speed and accuracy</li>
            </ul>
          </div>
        )}

        {activeTab === "review" && (
          <div style={styles.reviewContent}>
            <h2 style={styles.sectionTitle}>Review Previous Questions</h2>
            <p style={styles.reviewText}>
              Revisit questions you've answered before to reinforce your learning and identify areas for improvement.
            </p>
            <button style={styles.actionButton}>
              <RotateCcw size={16} />
              Start Review Session
            </button>
          </div>
        )}

        {activeTab === "practice" && (
          <div style={styles.practiceContent}>
            <h2 style={styles.sectionTitle}>Practice New Questions</h2>
            <p style={styles.practiceText}>
              Challenge yourself with new questions to further develop your skills and track your progress.
            </p>
            <button 
              style={styles.actionButton}
              onClick={() => router.push(`/practice?mode=skill&subject=2&category=${encodeURIComponent(skill.name)}`)}
            >
              <Play size={16} />
              Start Practice Session
            </button>
          </div>
        )}

        <div style={styles.resourcesSection}>
          <h2 style={styles.sectionTitle}>Additional Resources</h2>
          <div style={styles.resourceList}>
            <a href="#" style={styles.resourceLink}>
              <BookOpen size={16} />
              <span>Skill Guide: Mastering {skill.name}</span>
            </a>
            <a href="#" style={styles.resourceLink}>
              <Brain size={16} />
              <span>Video Tutorial: {skill.name} Explained</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main page component
export default function SkillDetailsPage() {
  return (
    <Suspense fallback={<div>Loading skill details...</div>}>
      <SkillDetailsContent />
    </Suspense>
  );
}

const styles = {
  container: {
    backgroundColor: "#f1f5f9",
    minHeight: "100vh",
    padding: "24px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    marginBottom: "24px",
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    color: "#4b5563",
  },
  title: {
    fontSize: "24px",
    fontWeight: 600,
    color: "#111827",
    marginLeft: "16px",
    textAlign: "center",
  },
  content: {
    backgroundColor: "white",
    borderRadius: "8px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  statsCard: {
    backgroundColor: "#f3f4f6",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "24px",
  },
  iconContainer: {
    width: "48px",
    height: "48px",
    borderRadius: "8px",
    backgroundColor: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
  },
  stats: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "16px",
  },
  stat: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    color: "#4b5563",
  },
  status: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "14px",
    fontWeight: 500,
  },
  progressContainer: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  progressBar: {
    flex: 1,
    height: "8px",
    backgroundColor: "#e5e7eb",
    borderRadius: "4px",
    overflow: "hidden",
  },
  progress: {
    height: "100%",
    transition: "width 0.3s ease",
  },
  progressText: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#374151",
    minWidth: "80px",
  },
  tabContainer: {
    display: "flex",
    borderBottom: "1px solid #e5e7eb",
    marginBottom: "24px",
  },
  tab: {
    padding: "12px 16px",
    backgroundColor: "transparent",
    border: "none",
    borderBottom: "2px solid transparent",
    cursor: "pointer",
    fontSize: "16px",
    color: "#6b7280",
    transition: "all 0.2s ease",
  },
  activeTab: {
    color: "#4338ca",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#111827",
    marginBottom: "16px",
  },
  overviewText: {
    fontSize: "16px",
    lineHeight: 1.5,
    color: "#4b5563",
    marginBottom: "24px",
  },
  subTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#374151",
    marginBottom: "12px",
  },
  tipsList: {
    paddingLeft: "24px",
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#4b5563",
  },
  reviewText: {
    fontSize: "16px",
    lineHeight: 1.5,
    color: "#4b5563",
    marginBottom: "24px",
  },
  practiceText: {
    fontSize: "16px",
    lineHeight: 1.5,
    color: "#4b5563",
    marginBottom: "24px",
  },
  actionButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 24px",
    backgroundColor: "#4338ca",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  resourcesSection: {
    marginTop: "32px",
  },
  resourceList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  resourceLink: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    color: "#4338ca",
    textDecoration: "none",
  },
}

