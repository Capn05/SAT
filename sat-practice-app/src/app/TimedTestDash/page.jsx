"use client"

import { useState, useEffect } from "react"
import { Clock, BookOpen, History, BarChart3, Brain, Timer, ArrowLeft,ChevronLeft, ChevronRight  } from "lucide-react"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import TopBar from "../components/TopBar"
import PreTestModal from "../components/PreTestModal"
import SubjectTabs from './component/tabs'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { formatDate, formatTime } from '../lib/utils'

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
  const [activeTab, setActiveTab] = useState("Complete")
  const [currentTests, setCurrentTests] = useState([])
  const [completedTests, setCompletedTests] = useState([])
  const [incompleteTests, setIncompleteTests] = useState([])
  const [availablePracticeTests, setAvailablePracticeTests] = useState([])
  const [selectedPracticeTest, setSelectedPracticeTest] = useState(null)
  const [isPracticeTestModalOpen, setIsPracticeTestModalOpen] = useState(false)
  const [pausedTests, setPausedTests] = useState([])
  const [isLoadingTests, setIsLoadingTests] = useState(true)
  
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
          subject_name: test.practice_tests?.subjects?.subject_name || 'Unknown',
          module1_score: test.module1_score,
          module2_score: test.module2_score,
          used_harder_module: test.used_harder_module
        }));
        
        setCompletedTests(formattedTests);
        console.log("completed tests:", formattedTests);
        
        // Initialize currentTests with completed tests
        if (activeTab === "Complete") {
          setCurrentTests(formattedTests);
        }
      } catch (err) {
        console.error('Error in fetchCompletedTests:', err);
      }
    };

    // We don't need to fetch incomplete tests separately for the new model
    // Adaptive tests are either completed or not tracked
    setIncompleteTests([]);

    fetchCompletedTests();
  }, [router, supabase.auth, activeTab]);

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
      setIsLoadingTests(true);
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
      } finally {
        setIsLoadingTests(false);
      }
    };

    fetchAvailablePracticeTests();
  }, [supabase.auth]);

  useEffect(() => {
    // Fetch paused tests
    const fetchPausedTests = async () => {
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
        
        const response = await fetch('/api/paused-test', {
          method: 'POST'
        });
        
        if (!response.ok) {
          console.error('Error fetching paused tests:', response.statusText);
          return;
        }
        
        const data = await response.json();
        const pausedTestsData = data.pausedTests || [];
        setPausedTests(pausedTestsData);
        
        // Update currentTests if on Paused tab
        if (activeTab === "Paused") {
          setCurrentTests(pausedTestsData);
        }
        
      } catch (err) {
        console.error('Error in fetchPausedTests:', err);
      }
    };

    fetchPausedTests();
  }, [supabase.auth, activeTab]);

  // Add this useEffect to handle pagination for the current tests
  useEffect(() => {
    // Get the correct source of tests based on active tab
    const allTests = activeTab === "Complete" ? completedTests : 
                     activeTab === "Paused" ? pausedTests : [];
    
    // Apply pagination
    const paginatedTests = allTests.slice(indexOfFirstTest, indexOfLastTest);
    setCurrentTests(paginatedTests);
  }, [activeTab, currentPage, completedTests, pausedTests, indexOfFirstTest, indexOfLastTest]);

  const handleTestClick = (subjectId) => {
    // If tests are still loading, show loading modal instead
    if (isLoadingTests) {
      setSelectedPracticeTest([]);
      setIsPracticeTestModalOpen(true);
      return;
    }
    
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

  // Add a SubjectTabs component
  const SubjectTabs = ({ activeTest, onSubjectChange }) => (
    <div style={styles.subjectTabs}>
      <div
        style={{
          ...styles.subjectTab,
          backgroundColor: activeTest === "Complete" ? "#10b981" : "transparent",
          color: activeTest === "Complete" ? "white" : "#4b5563",
        }}
        onClick={() => onSubjectChange("Complete")}
      >
        Completed Tests
      </div>
      <div
        style={{
          ...styles.subjectTab,
          backgroundColor: activeTest === "Paused" ? "#10b981" : "transparent",
          color: activeTest === "Paused" ? "white" : "#4b5563",
        }}
        onClick={() => onSubjectChange("Paused")}
      >
        Paused Tests
      </div>
    </div>
  );

  const handleSubjectChange = (test) => {
    setActiveTab(test);
    setCurrentPage(1); // Reset to first page when changing tabs
  }

  const totalTests = activeTab === "Complete" ? completedTests.length : pausedTests.length;
  const totalPages = Math.ceil(totalTests / testsPerPage);

  const handleTestHistoryClick = (test) => {
    // Navigate to review page
    router.push(`/review-test?testId=${test.test_id}`);
  };

  // Add this function to calculate SAT score (200-800 scale)
  const calculateSATScore = (subject, module1Correct, module2Correct, totalModule1, totalModule2, usedHarderModule) => {
    // Default base score
    let baseScore = 200;
    
    // Calculate points based on subject and modules
    if (subject === 'Math' || subject === 'Mathematics') {
      // Math scoring
      const module1Points = module1Correct * 16.8; // Each question in module 1 is worth ~16.8 points
      const module2Points = module2Correct * 10.1; // Each question in module 2 is worth ~10.1 points
      
      // Calculate raw score
      let rawScore = baseScore + module1Points + module2Points;
      
      // Cap the score based on module 2 difficulty
      // (This is a simplification - actual SAT scoring is more complex)
      if (!usedHarderModule) {
        rawScore = Math.min(rawScore, 650); // Cap at 650 for easier module 2
      }
      
      // Round to nearest 10
      return Math.min(800, Math.max(200, Math.round(rawScore / 10) * 10));
    } else {
      // Reading & Writing scoring
      const module1Points = module1Correct * 13.3; // Each question in module 1 is worth ~13.3 points
      const module2Points = module2Correct * 8.9; // Each question in module 2 is worth ~8.9 points
      
      // Calculate raw score
      let rawScore = baseScore + module1Points + module2Points;
      
      // Cap the score based on module 2 difficulty
      if (!usedHarderModule) {
        rawScore = Math.min(rawScore, 650); // Cap at 650 for easier module 2
      }
      
      // Round to nearest 10
      return Math.min(800, Math.max(200, Math.round(rawScore / 10) * 10));
    }
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

  const handleResumePausedTest = (pausedTest) => {
    if (!pausedTest || !pausedTest.practice_test_id || !pausedTest.test_module_id) {
      console.error('Invalid paused test data:', pausedTest);
      alert('Error resuming test. Please try starting a new test.');
      return;
    }
    
    console.log('Resuming test:', pausedTest);
    router.push(`/PracticeTestMode?testId=${pausedTest.practice_test_id}&moduleId=${pausedTest.test_module_id}`);
  };

  // Add a PracticeTestModal component with MST explanation
  const PracticeTestModal = ({ onClose, onStart }) => {
    const testsToShow = selectedPracticeTest || availablePracticeTests;
    
    return (
      <div style={styles.modalOverlay}>
        <div style={{...styles.modal, maxWidth: '700px', borderRadius: '12px'}}>
          <div style={{...styles.modalClose, fontSize: '24px', transition: 'color 0.2s ease'}} onClick={onClose}>×</div>
          <h2 style={{...styles.modalTitle, fontSize: '24px', color: '#1e293b', marginBottom: '16px'}}>Select a Practice Test</h2>
          
          {/* Add MST explanation */}
          <div style={{...styles.mstExplanation, backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '24px'}}>
            <h3 style={{...styles.mstExplanationTitle, fontSize: '18px', color: '#0f172a', marginBottom: '10px'}}>About Multistage Adaptive Testing (MST)</h3>
            <p style={{...styles.mstExplanationText, fontSize: '14px', color: '#334155', marginBottom: '12px'}}>
              The SAT uses a multistage adaptive testing approach:
            </p>
            <ol style={{...styles.mstExplanationList, paddingLeft: '20px'}}>
              <li style={{marginBottom: '8px', fontSize: '14px', color: '#334155'}}>You'll first complete <strong>Module 1</strong> with questions of mixed difficulty.</li>
              <li style={{marginBottom: '8px', fontSize: '14px', color: '#334155'}}>Based on your performance in Module 1, you'll be directed to either an <strong>easier</strong> or <strong>harder</strong> Module 2.</li>
              <li style={{fontSize: '14px', color: '#334155'}}>Your score is calculated based on your performance across both modules, with the harder module offering potential for higher scoring.</li>
            </ol>
          </div>
          
          {isLoadingTests ? (
            <div style={{...styles.loadingContainer, padding: '40px 0'}}>
              <div style={{...styles.loadingSpinner, borderColor: '#e2e8f0', borderTopColor: '#3b82f6'}}></div>
              <p style={{...styles.loadingText, color: '#64748b', marginTop: '16px'}}>Loading available tests...</p>
            </div>
          ) : testsToShow.length === 0 ? (
            <p style={{...styles.modalText, padding: '24px', textAlign: 'center', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '6px'}}>No practice tests available. Please check back later.</p>
          ) : (
            <>
              <p style={{...styles.modalText, fontSize: '16px', color: '#475569', marginBottom: '20px'}}>Choose a practice test to start:</p>
              <div style={{...styles.testList, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px'}}>
                {testsToShow.map(test => (
                  <div 
                    key={test.id} 
                    style={{
                      ...styles.testItem, 
                      borderRadius: '8px',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      border: '1px solid #e2e8f0',
                      padding: '16px'
                    }}
                    onClick={() => onStart(test.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.05)';
                    }}
                  >
                    <h3 style={{...styles.testItemTitle, fontSize: '18px', color: '#0f172a', marginBottom: '8px'}}>{test.name}</h3>
                    <p style={{...styles.testItemSubject, fontSize: '15px', color: '#475569', marginBottom: '12px'}}>
                      {test.subjects?.subject_name || 
                        (test.subject_id === 1 ? 'Math' : 
                        test.subject_id === 2 ? 'Reading & Writing' : 
                        'Unknown Subject')}
                    </p>
                    <div style={{...styles.testItemInfo, marginBottom: '12px'}}>
                      <span style={{
                        ...styles.testItemType,
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1',
                        fontSize: '12px',
                        padding: '4px 8px'
                      }}>
                        Adaptive Test
                      </span>
                      <span style={{
                        ...styles.testItemModules,
                        backgroundColor: '#dcfce7',
                        color: '#16a34a',
                        fontSize: '12px',
                        padding: '4px 8px'
                      }}>
                        Ready to Take
                      </span>
                    </div>
                    <p style={{...styles.testItemDetail, fontSize: '14px', color: '#64748b', marginBottom: '16px'}}>
                      {test.subject_id === 1 ? 
                        '44 questions • 70 minutes' : 
                        '54 questions • 64 minutes'}
                    </p>
                    <button style={{
                      ...styles.startTestButton, 
                      backgroundColor: '#10b981',
                      padding: '10px 0',
                      borderRadius: '6px',
                      fontWeight: '600',
                      transition: 'background-color 0.2s ease',
                      ':hover': {
                        backgroundColor: '#0db380'
                      }
                    }}>Start Test</button>
                  </div>
                ))}
              </div>
            </>
          )}
          
          <button style={{
            ...styles.modalCloseButton, 
            marginTop: '24px',
            padding: '12px 0',
            borderRadius: '6px',
            fontWeight: '500',
            color: '#475569',
            borderColor: '#cbd5e1',
            transition: 'background-color 0.2s ease',
            ':hover': {
              backgroundColor: '#f1f5f9'
            }
          }} onClick={onClose}>Cancel</button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <TopBar title={"Full Length Practice Tests"}/>

      <div style={{...styles.container, backgroundColor: '#f8fafc'}}>
        <div style={{...styles.content, maxWidth: '1200px'}}>
          <div style={styles.mainSection}>
            <h1 style={styles.pageTitle}>SAT Practice Tests</h1>
            <p style={styles.pageDescription}>
              Take full-length adaptive SAT practice tests that simulate the real testing experience
            </p>
            <div style={styles.testTypes}>
              <div
                style={{...styles.testCard, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', transition: 'transform 0.2s ease', ':hover': {transform: 'translateY(-4px)'}}}
                onClick={() => handleTestClick(1)}
              >
                <div style={{...styles.testIcon, backgroundColor: '#e0f2fe'}}>
                  <Brain size={28} color="#0369a1" />
                </div>
                <h2 style={styles.testTitle}>Math Adaptive Test</h2>
                <p style={styles.testInfo}>44 Questions • 70 Minutes</p>
                <p style={styles.testDescription}>
                  Full-length adaptive test with Module 1 (22 questions) and Module 2 (22 questions).
                </p>
                <button
                  style={{
                    ...styles.startButton,
                    opacity: isLoadingTests ? 0.7 : 1,
                    cursor: isLoadingTests ? 'default' : 'pointer',
                    backgroundColor: '#10b981',
                    transition: 'background-color 0.2s ease',
                  }}
                  onClick={() => handleTestClick(1)}
                >
                  {isLoadingTests ? 'Loading Tests...' : 'Start Math Test'}
                </button>
              </div>

              <div
                style={{...styles.testCard, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', transition: 'transform 0.2s ease', ':hover': {transform: 'translateY(-4px)'}}}
                onClick={() => handleTestClick(2)}
              >
                <div style={{...styles.testIcon, backgroundColor: '#fee2e2'}}>
                  <BookOpen size={28} color="#b91c1c" />
                </div>
                <h2 style={styles.testTitle}>Reading & Writing Adaptive Test</h2>
                <p style={styles.testInfo}>54 Questions • 64 Minutes</p>
                <p style={styles.testDescription}>
                  Full-length adaptive test with Module 1 (27 questions) and Module 2 (27 questions).
                </p>
                <button
                  style={{
                    ...styles.startButton,
                    opacity: isLoadingTests ? 0.7 : 1,
                    cursor: isLoadingTests ? 'default' : 'pointer',
                    backgroundColor: '#10b981',
                    transition: 'background-color 0.2s ease',
                  }}
                  onClick={() => handleTestClick(2)}
                >
                  {isLoadingTests ? 'Loading Tests...' : 'Start Reading & Writing Test'}
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

            <div style={{...styles.testHistorySection, backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'}}>
              <h2 style={styles.sectionTitle}>Test History</h2>
              <SubjectTabs activeTest={activeTab} onSubjectChange={handleSubjectChange} />
              <div style={styles.testHistoryList}>
                {/* Display paused tests in a grid */}
                {activeTab === "Paused" && (
                  <div style={{...styles.testsGrid, marginTop: '16px'}}>
                    {pausedTests.length > 0 ? pausedTests.map((test) => {
                      // Extract test details
                      const testName = test.practice_tests?.name || `Test #${test.practice_test_id}`;
                      const moduleNumber = test.test_modules?.module_number || '';
                      const moduleType = test.test_modules?.is_harder ? 'Higher Difficulty' : 'Lower Difficulty';
                      const subjectName = test.practice_tests?.subjects?.subject_name || 
                        (test.practice_tests?.subject_id === 1 ? 'Math' : 
                         test.practice_tests?.subject_id === 2 ? 'Reading & Writing' : 'Unknown');
                         
                      return (
                        <div 
                          key={test.id} 
                          style={{
                            ...styles.testCard,
                            cursor: 'pointer',
                            borderTop: '4px solid #f59e0b',
                            marginBottom: '0',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                          }}
                          onClick={() => handleResumePausedTest(test)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && handleResumePausedTest(test)}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                          <div>
                            <h3 style={{fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#0f172a'}}>{testName}</h3>
                            <div style={{marginBottom: '12px'}}>
                              <div style={{display: 'flex', alignItems: 'center', marginBottom: '4px'}}>
                                <Clock size={14} style={{color: '#64748b', marginRight: '6px'}} />
                                <span style={{fontSize: '14px', color: '#64748b'}}>{formatTime(test.time_remaining)} remaining</span>
                              </div>
                              <div style={{fontSize: '14px', color: '#64748b'}}>Paused on {formatDate(test.paused_at)}</div>
                            </div>
                            <div style={{display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px'}}>
                              <span style={{
                                backgroundColor: subjectName === 'Math' ? '#e0f2fe' : '#fee2e2',
                                color: subjectName === 'Math' ? '#0369a1' : '#b91c1c',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}>
                                {subjectName}
                              </span>
                              <span style={{
                                backgroundColor: '#f1f5f9',
                                color: '#64748b',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}>
                                Module {moduleNumber}
                              </span>
                              {moduleNumber === 2 && (
                                <span style={{
                                  backgroundColor: moduleType === 'Higher Difficulty' ? '#dcfce7' : '#fee2e2',
                                  color: moduleType === 'Higher Difficulty' ? '#16a34a' : '#b91c1c',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}>
                                  {moduleType}
                                </span>
                              )}
                            </div>
                          </div>
                          <button style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '10px 0',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            marginTop: '16px',
                            width: '100%'
                          }}>
                            <Clock size={18} />
                            Resume Test
                          </button>
                        </div>
                      );
                    }) : (
                      <div style={{...styles.emptyState, padding: '40px 0', gridColumn: '1 / -1'}}>
                        <div style={{...styles.emptyStateIcon, backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '50%'}}>
                          <Clock size={32} color="#64748b" />
                        </div>
                        <p style={{...styles.emptyStateText, fontSize: '16px', color: '#64748b', marginTop: '16px'}}>No paused tests found</p>
                        <p style={{fontSize: '14px', color: '#94a3b8', marginTop: '8px'}}>Start a test and pause it to see it here</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Display completed tests in a grid */}
                {activeTab === "Complete" && (
                  <div style={{...styles.testsGrid, marginTop: '16px'}}>
                    {currentTests.length > 0 ? currentTests.map((test) => {
                      // Determine the test name with fallbacks
                      const testName = test.test_name || `Test #${test.test_id}`;
                      const moduleType = test.used_harder_module ? 'Harder Module' : 'Easier Module';
                      
                      // Calculate correct percentage for overall and module scores
                      const totalScore = test.total_score !== undefined ? Math.round(test.total_score) : 'N/A';
                      const module1Score = test.module1_score !== undefined ? Math.round(test.module1_score) : 'N/A';
                      const module2Score = test.module2_score !== undefined ? Math.round(test.module2_score) : 'N/A';
                      
                      // Calculate SAT scaled score (200-800)
                      const subjectName = test.subject_name || 
                        (test.subject_id === 1 ? 'Math' : 
                        test.subject_id === 2 ? 'Reading & Writing' : 'Unknown');
                      
                      // Calculate correct answers for each module (based on percentages)
                      const defaultModuleQuestions = subjectName === 'Math' ? 22 : 27;
                      const module1Total = defaultModuleQuestions;
                      const module2Total = defaultModuleQuestions;
                      
                      const module1Correct = module1Score !== 'N/A' ? Math.round((module1Score / 100) * module1Total) : 0;
                      const module2Correct = module2Score !== 'N/A' ? Math.round((module2Score / 100) * module2Total) : 0;
                      
                      const satScore = calculateSATScore(
                        subjectName, 
                        module1Correct, 
                        module2Correct, 
                        module1Total, 
                        module2Total, 
                        test.used_harder_module
                      );
                      
                      return (
                        <div 
                          key={test.id} 
                          style={{
                            ...styles.testCard,
                            cursor: 'pointer',
                            borderTop: '4px solid #10b981',
                            marginBottom: '0',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                          }}
                          onClick={() => handleTestHistoryClick(test)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && handleTestHistoryClick(test)}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                          <div>
                            <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px'}}>
                              <h3 style={{fontSize: '18px', fontWeight: '600', color: '#0f172a', marginRight: '8px'}}>{testName}</h3>
                              <div style={{
                                backgroundColor: '#f1f5f9',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                fontSize: '20px',
                                fontWeight: '700',
                                color: '#0f172a',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: '90px',
                              }}>
                                {satScore}/800
                              </div>
                            </div>
                            <div style={{fontSize: '14px', color: '#64748b', marginBottom: '12px'}}>
                              {formatDate(test.taken_at)}
                            </div>
                            <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px'}}>
                              <span style={{
                                backgroundColor: subjectName === 'Math' ? '#e0f2fe' : '#fee2e2',
                                color: subjectName === 'Math' ? '#0369a1' : '#b91c1c',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}>
                                {subjectName}
                              </span>
                              {test.module2_score !== undefined && (
                                <span style={{
                                  backgroundColor: test.used_harder_module ? '#dcfce7' : '#fee2e2',
                                  color: test.used_harder_module ? '#16a34a' : '#b91c1c',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '500'
                                }}>
                                  {moduleType}
                                </span>
                              )}
                              <span style={{
                                backgroundColor: '#f1f5f9',
                                color: '#64748b',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}>
                                {totalScore}% accuracy
                              </span>
                            </div>
                            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#64748b', marginBottom: '4px'}}>
                              <span>Module 1:</span>
                              <span>{module1Score}%</span>
                            </div>
                            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#64748b'}}>
                              <span>Module 2:</span>
                              <span>{module2Score}%</span>
                            </div>
                          </div>
                          <button style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '10px 0',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            marginTop: '16px',
                            width: '100%'
                          }}>
                            <BarChart3 size={18} />
                            View Results
                          </button>
                        </div>
                      );
                    }) : (
                      <div style={{...styles.emptyState, padding: '40px 0', gridColumn: '1 / -1'}}>
                        <div style={{...styles.emptyStateIcon, backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '50%'}}>
                          <History size={32} color="#64748b" />
                        </div>
                        <p style={{...styles.emptyStateText, fontSize: '16px', color: '#64748b', marginTop: '16px'}}>No completed tests found</p>
                        <p style={{fontSize: '14px', color: '#94a3b8', marginTop: '8px'}}>Start a test to see your results here</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={styles.pagination}>
                  <button 
                    onClick={() => paginate(currentPage - 1)} 
                    disabled={currentPage === 1}
                    style={{
                      ...styles.paginationButton,
                      ...(currentPage === 1 ? {
                        backgroundColor: '#f1f5f9',
                        color: '#94a3b8',
                        cursor: 'not-allowed'
                      } : {
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1',
                        cursor: 'pointer'
                      })
                    }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span style={{...styles.paginationInfo, color: '#64748b'}}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    onClick={() => paginate(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                    style={{
                      ...styles.paginationButton,
                      ...(currentPage === totalPages ? {
                        backgroundColor: '#f1f5f9',
                        color: '#94a3b8',
                        cursor: 'not-allowed'
                      } : {
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1',
                        cursor: 'pointer'
                      })
                    }}
                  >
                    <ChevronRight size={18} />
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
    backgroundColor: "#f8fafc",
    padding: "20px 0",
  },
  content: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 20px",
  },
  pageTitle: {
    fontSize: "28px", 
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: "8px",
  },
  pageDescription: {
    fontSize: "16px",
    color: "#64748b",
    marginBottom: "24px",
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
  },
  testsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "16px",
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
  pausedLabel: {
    backgroundColor: '#fdba74',
    color: '#7c2d12',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    borderRadius: '8px',
    backgroundColor: '#f3f4f6',
    width: '100%',
  },
  emptyStateIcon: {
    marginBottom: '1rem',
  },
  emptyStateText: {
    fontSize: '1rem',
    color: '#6b7280',
    textAlign: 'center',
  },
  subjectTabs: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    backgroundColor: "#f1f5f9",
    padding: "4px",
    borderRadius: "8px",
    width: "fit-content",
  },
  subjectTab: {
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "14px",
    transition: "all 0.2s ease",
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #10b981',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },
  loadingText: {
    fontSize: '1rem',
    color: '#6b7280',
  },
}
