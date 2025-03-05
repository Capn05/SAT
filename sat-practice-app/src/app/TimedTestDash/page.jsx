"use client"

import { useState, useEffect } from "react"
import { Clock, BookOpen, History, BarChart3, Brain, Timer, ArrowLeft,ChevronLeft, ChevronRight  } from "lucide-react"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import TopBar from "../components/TopBar"
import PreTestModal from "../components/PreTestModal"
import SubjectTabs from './component/tabs'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

import "../global.css"

export default function PracticeTestsPage() {
  const [selectedSection, setSelectedSection] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const testsPerPage = 5
  const indexOfLastTest = currentPage * testsPerPage
  const indexOfFirstTest = indexOfLastTest - testsPerPage
  const paginate = (pageNumber) => setCurrentPage(pageNumber)
  const router = useRouter()
  const [currentTestType, setCurrentTestType] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('Past')
  const [completedTests, setCompletedTests] = useState([])
  const [incompleteTests, setIncompleteTests] = useState([])
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Fetch completed tests for the specific user
    const fetchCompletedTests = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error fetching session:', error);
          router.push('/login');
          return;
        }
        
        if (!session) {
          console.error('No session found, redirecting to login');
          router.push('/login');
          return;
        }
        
        const response = await fetch(`/api/pasts-tests?userId=${session.user.id}`);
        const data = await response.json();
        
        if (response.ok) {
          setCompletedTests(data);
          console.log("completed tests: "+ JSON.stringify(data))
        } else {
          console.error('Error fetching completed tests:', data.error);
        }
      } catch (err) {
        console.error('Error in fetchCompletedTests:', err);
      }
    };

    // Fetch all tests
    const fetchIncompleteTests = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error fetching session:', error);
          router.push('/login');
          return;
        }
        
        if (!session) {
          console.error('No session found, redirecting to login');
          router.push('/login');
          return;
        }

        const response = await fetch(`/api/incomplete-tests?userId=${session.user.id}`);
        const data = await response.json();
        console.log("incomplete tests:  "+ JSON.stringify(data) )

        if (response.ok) {
          setIncompleteTests(data);
        } else {
          console.error('Error fetching incomplete tests:', data.error);
        }
      } catch (err) {
        console.error('Error in fetchIncompleteTests:', err);
      }
    };

    fetchCompletedTests();
    fetchIncompleteTests();
  }, [router]);

  const handleTestClick = (type) => {
    setCurrentTestType(type)
    setIsModalOpen(true)
  }

  const handleStartTest = (testId) => {
    setIsModalOpen(false)
    router.push(`/TestMode?testId=${testId}`)
  }

  const handleSubjectChange = (subject) => {
    setActiveTab(subject)
  }

  const filteredTests = incompleteTests

  const totalTests = activeTab === "Past" ? completedTests.length : incompleteTests.length;
  const totalPages = Math.ceil(totalTests / testsPerPage);

  const currentTests = (activeTab === "Past" ? completedTests : incompleteTests).slice(indexOfFirstTest, indexOfLastTest);

  const handleTestHistoryClick = (test) => {
      // If the test is completed, navigate to review page
      router.push(`/review-test?testId=${test.test_id}`);
 
  };

  return (
    <div style={styles.container}>
      <TopBar title={"Full Length Practice Tests"}/>

      <div style={styles.content}>
        <div style={styles.mainSection}>
          <div style={styles.testTypes}>
            <div
              style={{
                ...styles.testCard,
                ...(selectedSection === "math" ? styles.selectedCard : {}),
              }}
              onClick={() => handleTestClick("Math")}
            >
              <div style={styles.testIcon}>
                <Brain size={24} />
              </div>
              <h2 style={styles.testTitle}>Math Section</h2>
              <p style={styles.testInfo}>20 Questions • 35 Minutes</p>
              <button
                style={styles.startButton}
                onClick={() => handleTestClick("Math")}
              >
                Start Test
              </button>
            </div>

            <div
              style={{
                ...styles.testCard,
                ...(selectedSection === "reading" ? styles.selectedCard : {}),
              }}
              onClick={() => handleTestClick("Reading/Writing")}
            >
              <div style={styles.testIcon}>
                <BookOpen size={24} />
              </div>
              <h2 style={styles.testTitle}>Reading & Writing</h2>
              <p style={styles.testInfo}>25 Questions • 32 Minutes</p>
              <button
                style={styles.startButton}
                onClick={() => handleTestClick("Reading/Writing")}
              >
                Start Test
              </button>
            </div>
          </div>

          {isModalOpen && (
            <PreTestModal
              testType={currentTestType}
              onStart={handleStartTest}
              onClose={() => setIsModalOpen(false)}
            />
          )}

          <div style={styles.testHistorySection}>
            <h2 style={styles.sectionTitle}>Test History</h2>
            <SubjectTabs activeTest={activeTab} onSubjectChange={handleSubjectChange} />
            <div style={styles.testHistoryList}>
                            {/* New Row for Starting a New Test */}
                            <div style={styles.testHistoryItem} onClick={() => handleTestClick()} role="button" tabIndex={0} onKeyPress={(e) => e.key === 'Enter' && handleStartTest()}>
                <div style={styles.testHistoryInfo}>
                  <h3 style={styles.testHistoryName}>Start a New Test</h3>
                  <p style={styles.testHistoryDate}>Click here to begin a new test</p>
                </div>
                <div style={styles.testHistoryDetails}>
                  {/* <span style={styles.startNewTestText}>Start New Test</span> */}
                </div>
              </div>
              {currentTests.map((test) => (
                <div 
                  key={test.id} 
                  style={styles.testHistoryItem}
                  onClick={() => handleTestHistoryClick(test)}
                  role="button"
                  tabIndex={0}
                >
                  <div style={styles.testHistoryInfo}>
                    <h3 style={styles.testHistoryName}>{test.name}</h3>
                    <p style={styles.testHistoryDate}>{test.date}</p>
                  </div>
                  <div style={styles.testHistoryDetails}>
                    <span style={styles.testHistoryType}>{test.type}</span>
                    <span style={styles.testHistoryScore}>Score: {test.score}</span>
                  </div>
                </div>
              ))}


            </div>
            <div style={styles.pagination}>
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  ...styles.paginationButton,
                  ...(currentPage === 1 ? styles.paginationButtonDisabled : {}),
                }}
              >
                <ChevronLeft size={20} />
              </button>
              <span style={styles.paginationInfo}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  ...styles.paginationButton,
                  ...(currentPage === totalPages ? styles.paginationButtonDisabled : {}),
                }}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
  

        <div style={styles.sidebar}>
          <div style={styles.recentTests}>
            <h2 style={styles.sidebarTitle}>Recent Tests</h2>
            {completedTests.slice(0, 3).map((test) => (
              <div key={test.id} style={styles.recentTest}>
                <div style={styles.testMeta}>
                  <h3 style={styles.testName}>{test.name}</h3>
                  <span style={styles.testDate}>{test.date}</span>
                </div>
                <div style={styles.testScore}>
                  <span style={styles.scoreLabel}>Score</span>
                  <span style={styles.scoreValue}>{test.score}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={styles.featureCard}>
            <Timer size={20} />
            <h3 style={styles.featureTitle}>Learn about the SAT</h3>
            <p style={styles.featureText}>Learn strategies to effectively manage your time during the test</p>
          </div>
          <div style={styles.featureCard}>
            <BarChart3 size={20} />
            <h3 style={styles.featureTitle}>Performance Analytics</h3>
            <p style={styles.featureText}>Get detailed insights into your strengths and areas for improvement</p>
          </div>
          <div style={styles.tips}>
            <h2 style={styles.sidebarTitle}>Test Day Tips</h2>
            <ul style={styles.tipsList}>
              <li>Get a good night's sleep before the test</li>
              <li>Read all instructions carefully</li>
              <li>Pace yourself - don't spend too much time on one question</li>
              <li>Review your answers if time permits</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

const recentTests = [
  {
    name: "Math Practice Test 3",
    date: "2 days ago",
    score: "720/800",
  },
  {
    name: "Reading & Writing Test 2",
    date: "5 days ago",
    score: "680/800",
  },
  {
    name: "Math Practice Test 2",
    date: "1 week ago",
    score: "700/800",
  },
]

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "white",
    padding: "24px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    marginBottom: "24px",
  },
  backLink: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#4b5563",
    textDecoration: "none",
    fontSize: "14px",
  },
  title: {
    fontSize: "24px",
    fontWeight: 600,
    color: "#111827",
    marginLeft: "16px",
  },
  content: {
    display: "grid",
    gridTemplateColumns: "1fr 300px",
    gap: "24px",
    paddingTop:"20px"
  },
  mainSection: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  testTypes: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "24px",
    backgroundColor: "white",
    borderRadius: "8px",
  },
  testCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "24px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: "2px solid transparent",
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
  },
  selectedCard: {
    borderColor: "#4338ca",
    backgroundColor: "#fafafa",
  },
  testIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    backgroundColor: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
  },
  testTitle: {
    fontSize: "18px",
    fontWeight: 600,
    color: "#111827",
    marginBottom: "8px",
  },
  testInfo: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "16px",
  },
  startButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#e6f0e6",
    color: "#065f46",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    backgroundColor: "white",
  },
  featureCard: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "12px",
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
  },
  featureTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#111827",
  },
  featureText: {
    fontSize: "14px",
    color: "#6b7280",
    lineHeight: 1.5,
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  recentTests: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
  },
  sidebarTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#111827",
    marginBottom: "16px",
  },
  recentTest: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #e5e7eb",
  },
  testMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  testName: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#111827",
  },
  testDate: {
    fontSize: "12px",
    color: "#6b7280",
  },
  testScore: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "2px",
  },
  scoreLabel: {
    fontSize: "12px",
    color: "#6b7280",
  },
  scoreValue: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#4338ca",
  },
  tips: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
    backgroundColor: "#f8fafc",
  },
  tipsList: {
    listStyle: "disc",
    paddingLeft: "20px",
    fontSize: "14px",
    color: "#4b5563",
    lineHeight: 1.6,
  },
  testHistorySection: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "24px",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: 600,
    color: "#111827",
    marginBottom: "16px",
  },
  testHistoryList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  testHistoryItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    backgroundColor: "#f3f4f6",
    borderRadius: "8px",
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#f3f4f6',
    },
  },
  testHistoryItemHover: {
    backgroundColor: "#e5e7eb",
  },
  testHistoryInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  testHistoryName: {
    fontSize: "16px",
    fontWeight: 500,
    color: "#111827",
  },
  testHistoryDate: {
    fontSize: "14px",
    color: "#6b7280",
  },
  testHistoryDetails: {
    display: "flex",
    flexDirection: "column" ,
    alignItems: "flex-end",
    gap: "4px",
  },
  testHistoryType: {
    fontSize: "14px",
    color: "#4b5563",
  },
  testHistoryScore: {
    fontSize: "16px",
    fontWeight: 500,
    color: "#4338ca",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "24px",
    gap: "16px",
  },
  paginationButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    backgroundColor: "#e6f0e6",
    color: "#065f46",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
  paginationButtonDisabled: {
    backgroundColor: "#9ca3af",
    cursor: "not-allowed",
  },
  paginationInfo: {
    fontSize: "14px",
    color: "#4b5563",
  },
  startNewTestButton: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#e6f0e6",
    color: "#065f46",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "background-color 0.2s ease",
  },
}

