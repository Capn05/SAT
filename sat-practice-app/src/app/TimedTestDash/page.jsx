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
  const [availablePracticeTests, setAvailablePracticeTests] = useState([]);
  const [selectedPracticeTest, setSelectedPracticeTest] = useState(null);
  const [isPracticeTestModalOpen, setIsPracticeTestModalOpen] = useState(false);
  
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
        
        // Fetch test analytics from the user_test_analytics table
        const { data, error: analyticsError } = await supabase
          .from('user_test_analytics')
          .select(`
            id,
            user_id,
            practice_test_id,
            taken_at,
            module1_score,
            module2_score,
            used_harder_module,
            total_score,
            practice_tests(id, name, subject_id, subjects(subject_name))
          `)
          .eq('user_id', session.user.id)
          .order('taken_at', { ascending: false });
          
        if (analyticsError) {
          console.error('Error fetching completed tests:', analyticsError);
          return;
        }
        
        // Format the data to match the expected structure
        const formattedTests = data.map(test => ({
          id: test.id,
          test_id: test.practice_test_id,
          user_id: test.user_id,
          taken_at: test.taken_at,
          total_score: test.total_score,
          test_name: test.practice_tests?.name || `Test #${test.practice_test_id}`,
          subject_name: test.practice_tests?.subjects?.subject_name || 'Unknown'
        }));
        
        setCompletedTests(formattedTests);
        console.log("completed tests:", formattedTests);
      } catch (err) {
        console.error('Error in fetchCompletedTests:', err);
      }
    };

    // We don't need to fetch incomplete tests separately for the new model
    // Adaptive tests are either completed or not tracked
    setIncompleteTests([]);

    fetchCompletedTests();
  }, [router, supabase.auth]);

  // Add this separate effect to log when completedTests changes
  useEffect(() => {
    console.log("Completed tests array:", completedTests);
    if (completedTests.length > 0) {
      console.log("First test object example:", completedTests[0]);
      // Log all property names of the first test object
      console.log("Available properties:", Object.keys(completedTests[0]));
    }
  }, [completedTests]);

  // Update how we handle available practice tests
  useEffect(() => {
    const fetchAvailablePracticeTests = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error fetching session:', error);
          return;
        }
        
        if (!session) {
          console.error('No session found');
          return;
        }
        
        // Use our API endpoint instead of direct Supabase queries
        const response = await fetch('/api/practice-tests');
        
        if (!response.ok) {
          console.error('Error fetching practice tests:', response.statusText);
          return;
        }
        
        const data = await response.json();
        console.log("Practice tests:", data);
        
        // Filter tests that have modules and are not completed by user - don't require "isComplete"
        const validTests = data.filter(test => 
          test.hasModules && !test.completed
        );
        
        setAvailablePracticeTests(validTests);
      } catch (err) {
        console.error('Error in fetchAvailablePracticeTests:', err);
      }
    };

    fetchAvailablePracticeTests();
  }, [supabase.auth]);

  const handleTestClick = (subjectId) => {
    // Filter available practice tests by subject
    const subjectTests = availablePracticeTests.filter(test => 
      test.subject_id === subjectId
    );
    
    if (subjectTests.length > 0) {
      setSelectedPracticeTest(subjectTests);
      setIsPracticeTestModalOpen(true);
    } else {
      alert("No available tests for this subject. Please check back later.");
    }
  };

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
    // Navigate to review page
    router.push(`/review-test?testId=${test.test_id}`);
  };

  // Add this function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'No date available';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Invalid date';
      
      // Format options
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date error';
    }
  };

  const handleStartPracticeTest = (testId) => {
    setIsPracticeTestModalOpen(false);
    router.push(`/PracticeTestMode?testId=${testId}`);
  };

  // Add a PracticeTestModal component with MST explanation
  const PracticeTestModal = ({ onClose, onStart }) => {
    const testsToShow = selectedPracticeTest || availablePracticeTests;
    
    return (
      <div style={styles.modalOverlay}>
        <div style={styles.modal}>
          <div style={styles.modalClose} onClick={onClose}>×</div>
          <h2 style={styles.modalTitle}>Select a Practice Test</h2>
          
          {/* Add MST explanation */}
          <div style={styles.mstExplanation}>
            <h3 style={styles.mstExplanationTitle}>About Multistage Adaptive Testing (MST)</h3>
            <p style={styles.mstExplanationText}>
              The SAT uses a multistage adaptive testing approach:
            </p>
            <ol style={styles.mstExplanationList}>
              <li>You'll first complete <strong>Module 1</strong> with questions of mixed difficulty.</li>
              <li>Based on your performance in Module 1, you'll be directed to either an <strong>easier</strong> or <strong>harder</strong> Module 2.</li>
              <li>Your score is calculated based on your performance across both modules, with the harder module offering potential for higher scoring.</li>
            </ol>
          </div>
          
          {testsToShow.length === 0 ? (
            <p style={styles.modalText}>No practice tests available. Please check back later.</p>
          ) : (
            <>
              <p style={styles.modalText}>Choose a practice test to start:</p>
              <div style={styles.testList}>
                {testsToShow.map(test => (
                  <div 
                    key={test.id} 
                    style={styles.testItem}
                    onClick={() => onStart(test.id)}
                  >
                    <h3 style={styles.testItemTitle}>{test.name}</h3>
                    <p style={styles.testItemSubject}>
                      {test.subjects?.subject_name || 
                        (test.subject_id === 1 ? 'Math' : 
                        test.subject_id === 2 ? 'Reading & Writing' : 
                        'Unknown Subject')}
                    </p>
                    <div style={styles.testItemInfo}>
                      <span style={styles.testItemType}>
                        Adaptive Test
                      </span>
                      <span style={styles.testItemModules}>
                        Ready to Take
                      </span>
                    </div>
                    <p style={styles.testItemDetail}>
                      {test.subject_id === 1 ? 
                        '44 questions • 70 minutes' : 
                        '54 questions • 64 minutes'}
                    </p>
                    <button style={styles.startTestButton}>Start Test</button>
                  </div>
                ))}
              </div>
            </>
          )}
          
          <button style={styles.modalCloseButton} onClick={onClose}>Cancel</button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <TopBar title={"Full Length Practice Tests"}/>

      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.mainSection}>
            <div style={styles.testTypes}>
              <div
                style={styles.testCard}
                onClick={() => handleTestClick(1)}
              >
                <div style={styles.testIcon}>
                  <Brain size={24} />
                </div>
                <h2 style={styles.testTitle}>Math Adaptive Test</h2>
                <p style={styles.testInfo}>44 Questions • 70 Minutes</p>
                <p style={styles.testDescription}>
                  Full-length adaptive test with Module 1 (22 questions) and Module 2 (22 questions).
                </p>
                <button
                  style={styles.startButton}
                  onClick={() => handleTestClick(1)}
                >
                  Start Math Test
                </button>
              </div>

              <div
                style={styles.testCard}
                onClick={() => handleTestClick(2)}
              >
                <div style={styles.testIcon}>
                  <BookOpen size={24} />
                </div>
                <h2 style={styles.testTitle}>Reading & Writing Adaptive Test</h2>
                <p style={styles.testInfo}>54 Questions • 64 Minutes</p>
                <p style={styles.testDescription}>
                  Full-length adaptive test with Module 1 (27 questions) and Module 2 (27 questions).
                </p>
                <button
                  style={styles.startButton}
                  onClick={() => handleTestClick(2)}
                >
                  Start Reading & Writing Test
                </button>
              </div>
            </div>

            {/* Add the practice test modal */}
            {isPracticeTestModalOpen && (
              <PracticeTestModal
                onStart={handleStartPracticeTest}
                onClose={() => setIsPracticeTestModalOpen(false)}
              />
            )}

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
                {/* New Row for Starting a New Test with two options */}
                <div style={styles.startNewTestContainer}>
                  <h3 style={styles.startNewTestTitle}>Start a New Test</h3>
                  <div style={styles.startNewTestOptions}>
                    <button 
                      style={styles.startNewTestButton}
                      onClick={() => handleTestClick(1)}
                    >
                      <Brain size={16} style={styles.startNewTestIcon} />
                      Math Adaptive Test
                    </button>
                    <button 
                      style={styles.startNewTestButton}
                      onClick={() => handleTestClick(2)}
                    >
                      <BookOpen size={16} style={styles.startNewTestIcon} />
                      Reading & Writing Adaptive Test
                    </button>
                  </div>
                </div>
                
                {currentTests.map((test) => {
                  // Determine the test name with fallbacks
                  const testName = test.test_name || `Test #${test.test_id}`;
                  
                  return (
                    <div 
                      key={test.id} 
                      style={{
                        ...styles.testHistoryItem,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        borderLeft: activeTab === "Past" ? '4px solid #10b981' : '4px solid transparent',
                      }}
                      onClick={() => handleTestHistoryClick(test)}
                      role="button"
                      tabIndex={0}
                      onKeyPress={(e) => e.key === 'Enter' && handleTestHistoryClick(test)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                    >
                      <div style={styles.testHistoryInfo}>
                        <h3 style={styles.testHistoryName}>{testName}</h3>
                        <p style={styles.testHistoryDate}>
                          {formatDate(test.taken_at)}
                        </p>
                        <p style={styles.testHistorySubject}>
                          {test.subject_name || 
                            (test.subject_id === 1 ? 'Math' : 
                             test.subject_id === 2 ? 'Reading & Writing' : 
                             'Subject not available')}
                        </p>
                      </div>
                      <div style={styles.testHistoryDetails}>
                        <span style={styles.testHistoryScore}>
                          {test.total_score !== undefined ? `${Math.round(test.total_score)}%` : 'N/A'}
                        </span>
                        <ChevronRight size={16} style={styles.testHistoryArrow} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={styles.pagination}>
                  <button 
                    onClick={() => paginate(currentPage - 1)} 
                    disabled={currentPage === 1}
                    style={{
                      ...styles.paginationButton,
                      opacity: currentPage === 1 ? 0.5 : 1,
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => paginate(index + 1)}
                      style={{
                        ...styles.paginationButton,
                        backgroundColor: currentPage === index + 1 ? '#4f46e5' : 'white',
                        color: currentPage === index + 1 ? 'white' : '#1f2937',
                      }}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button 
                    onClick={() => paginate(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                    style={{
                      ...styles.paginationButton,
                      opacity: currentPage === totalPages ? 0.5 : 1,
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
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
    backgroundColor: "#f9fafb",
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
    paddingTop:"20px",
    margin:"0 1vh  0 1vh",
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
    backgroundColor: "#f9fafb",
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
    backgroundColor: "#10b981",
    color: "white", 
    padding: "0.5rem 1.25rem",
    borderRadius: "0.375rem",
    fontWeight: 500,
    width: "100%",
    border: "none",
    cursor: "pointer",
    textAlign: "center",
    textDecoration: "none",
    display: "inline-block",
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
    padding: "16px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    marginBottom: "8px",
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
    marginBottom: "4px",
  },
  testHistoryDate: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "4px",
  },
  testHistorySubject: {
    fontSize: "12px",
    color: "#6b7280",
    backgroundColor: "#f3f4f6",
    padding: "2px 6px",
    borderRadius: "4px",
    display: "inline-block",
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
  startNewTestContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  startNewTestTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '12px',
  },
  startNewTestOptions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  startNewTestButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    flex: '1',
    minWidth: '180px',
  },
  startNewTestIcon: {
    color: 'white',
  },
  reviewButton: {
    display: "flex",
    alignItems: "center",
    marginTop: "8px",
    color: "#10b981",
    fontWeight: 500,
    fontSize: "14px",
  },
  reviewText: {
    marginRight: "6px",
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '2rem',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative',
  },
  modalClose: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#6b7280',
  },
  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: '#111827',
  },
  modalText: {
    fontSize: '1rem',
    color: '#4b5563',
    marginBottom: '1.5rem',
  },
  testList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  testItem: {
    padding: '1rem',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  testItemTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    margin: '0 0 0.5rem 0',
  },
  testItemSubject: {
    fontSize: '0.875rem',
    color: '#6b7280',
    margin: '0 0 1rem 0',
  },
  startTestButton: {
    width: '100%',
    padding: '0.5rem 0',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#4f46e5',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  modalCloseButton: {
    width: '100%',
    padding: '0.75rem 0',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    color: '#4b5563',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  testHistoryArrow: {
    width: '16px',
    height: '16px',
    fill: '#4b5563',
  },
  testItemInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.75rem',
    fontSize: '0.75rem',
    color: '#6b7280',
  },
  testItemType: {
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    padding: '0.125rem 0.375rem',
    borderRadius: '0.25rem',
    fontWeight: '500',
  },
  testItemModules: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
    padding: '0.125rem 0.375rem',
    borderRadius: '0.25rem',
    fontWeight: '500',
  },
  testDescription: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '16px',
    lineHeight: '1.4',
  },
  mstExplanation: {
    backgroundColor: '#f0f9ff',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1.5rem',
    border: '1px solid #bae6fd',
  },
  mstExplanationTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: '0.5rem',
  },
  mstExplanationText: {
    fontSize: '0.875rem',
    color: '#0c4a6e',
    marginBottom: '0.5rem',
  },
  mstExplanationList: {
    paddingLeft: '1.5rem',
    fontSize: '0.875rem',
    color: '#0c4a6e',
    lineHeight: '1.4',
  },
  testItemDetail: {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginBottom: '0.75rem',
  },
}
