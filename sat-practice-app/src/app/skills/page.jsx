"use client"
import { useState, useEffect } from "react"
import {
  Brain,
  FileText,
  Calculator,
  Lightbulb,
  BookOpen,
  NetworkIcon as Connection,
  ArrowRightLeft,
  Puzzle,
  GanttChart,
  Pencil,
  ActivityIcon as Function,
  Shapes,
  PieChart,
  FunctionSquare,
  BarChart,
  Network,
  Percent,
  Divide,
  LineChart,
  Circle,
  Box,
  PenTool,
  FlaskRoundIcon,
  Infinity,
  Sigma,
} from "lucide-react"
import SkillsHeader from "../components/TopBar"
import SkillCard from "./components/SkillCard"
import DomainSection from "./components/DomainSection"
import SubjectTabs from "./components/SubjectTabs"
import './styles.css'; // Adjust the path as necessary
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import SubscriptionCheck from '../../components/SubscriptionCheck'

// Consistent mastery level calculation function
function calculateMasteryLevel(accuracy, totalAttempts) {
  if (totalAttempts === 0) {
    return 'Not Started';
  }
  if (totalAttempts < 5) {
    return 'Needs More Attempts';
  }
  if (accuracy >= 85) {
    return 'Mastered';
  }
  if (accuracy >= 60) {
    return 'Improving';
  }
  return 'Needs Work';
}

const categoryIcons = {
  // Math Categories
  'Algebra': Calculator,
  'Advanced Math': FunctionSquare,
  'Problem Solving': Brain,
  'Problem-Solving and Data Analysis': BarChart,
  'Geometry and Trigonometry': Shapes,
  
  // Math Subcategories
  'Linear Equations': Calculator,
  'Systems of Equations': Network,
  'Quadratic Equations': FunctionSquare,
  'Exponential Functions': PieChart,
  'Geometry & Trigonometry': Shapes,
  'Data Analysis': BarChart,
  
  // Specific Math Topics
  'Equivalent Expressions': Sigma,
  'Nonlinear Equations and Systems': Infinity,
  'Nonlinear Functions': LineChart,
  'Linear Equations in One Variable': Calculator,
  'Linear Equations in Two Variables': Network,
  'Linear Functions': LineChart,
  'Systems of Linear Equations': Network,
  'One-Variable Data': BarChart,
  'Two-Variable Data': PieChart,
  'Probability': Percent,
  'Sample Statistics and Margin of Error': BarChart,
  'Evaluating Statistical Claims': Brain,
  'Percentages': Percent,
  'Ratios': Divide,
  'Rates': Divide,
  'Proportions, and Units': Divide,
  'Lines, Angles, and Triangles': Shapes,
  'Right Triangles and Trigonometry': Shapes,
  'Circles': Circle,
  'Area and Volume': Box,
  
  // Reading Categories
  'Information and Ideas': BookOpen,
  'Craft and Structure': FileText,
  'Expression of Ideas': PenTool,
  'Standard English Conventions': FlaskRoundIcon,
  
  // Reading Subcategories
  'Central Ideas and Details': BookOpen,
  'Command of Evidence (Textual)': FileText,
  'Command of Evidence (Quantitative)': BarChart,
  'Command of Evidence': FileText,
  'Inferences': Lightbulb,
  'Words in Context': PenTool,
  'Text Structure and Purpose': Network,
  'Text, Structure, and Purpose': Network,
  'Cross-Text Connections': Network,
  'Rhetorical Synthesis': PenTool,
  'Transitions': Network,
  'Boundaries': FlaskRoundIcon,
  'Form, Structure, and Sense': Shapes,
  'Linear Inequalities': Calculator,
};

// Hard-coded PSAT distribution percentages and question counts
const satDistributions = {
  // Reading & Writing distributions
  "Craft and Structure": { percentage: 28, questions: "13-15" },
  "Information and Ideas": { percentage: 26, questions: "12-14" },
  "Standard English Conventions": { percentage: 26, questions: "11-15" },
  "Expression of Ideas": { percentage: 20, questions: "8-12" },
  
  // Math distributions (using approximate values based on standard PSAT)
  "Algebra": { percentage: 35, questions: "13-15" },
  "Problem-Solving and Data Analysis": { percentage: 15, questions: "5-7" },
  "Advanced Math": { percentage: 35, questions: "13-15" },
  "Geometry and Trigonometry": { percentage: 15, questions: "5-7" }
};

// Define the known domains and distributions with the correct skill counts
const mathDomainData = [
  {
    name: 'Advanced Math',
    distribution: '≈35%',
    questions: '13-15 questions',
    skills: [],
    loadingCount: 3
  },
  {
    name: 'Algebra',
    distribution: '≈35%',
    questions: '13-15 questions',
    skills: [],
    loadingCount: 5
  },
  {
    name: 'Geometry and Trigonometry',
    distribution: '≈15%',
    questions: '5-7 questions',
    skills: [],
    loadingCount: 4
  },
  {
    name: 'Problem-Solving and Data Analysis',
    distribution: '≈15%',
    questions: '5-7 questions',
    skills: [],
    loadingCount: 7
  }
];

const readingDomainData = [
  {
    name: 'Craft and Structure',
    distribution: '≈28%',
    questions: '13-15 questions',
    skills: [],
    loadingCount: 3
  },
  {
    name: 'Expression of Ideas',
    distribution: '≈20%',
    questions: '8-12 questions',
    skills: [],
    loadingCount: 2
  },
  {
    name: 'Information and Ideas',
    distribution: '≈26%',
    questions: '12-14 questions',
    skills: [],
    loadingCount: 3
  },
  {
    name: 'Standard English Conventions',
    distribution: '≈26%',
    questions: '11-15 questions',
    skills: [],
    loadingCount: 2
  }
];

export default function SkillsPage() {
  const [activeSubject, setActiveSubject] = useState("math")
  const [mathDomains, setMathDomains] = useState(mathDomainData)
  const [readingDomains, setReadingDomains] = useState(readingDomainData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Check URL for subject parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subjectParam = params.get('subject');
    
    if (subjectParam) {
      // Set active subject based on subject_id from URL
      if (subjectParam === '1' || subjectParam === 1) {
        setActiveSubject("math");
      } else if (subjectParam === '2' || subjectParam === 2) {
        setActiveSubject("reading");
      }
    } else {
      // Default to math if no subject provided
      setActiveSubject("math");
      
      // Update URL to include the default subject
      const newUrl = new URL(window.location);
      newUrl.searchParams.set('subject', '1');
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  // Helper function to refresh skills cache automatically
  const refreshSkillsCache = async (subjectId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found, redirecting to login');
        router.push('/login');
        return;
      }
      
      await fetch('/api/refresh-skills-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          subject: subjectId
        }),
      });
      
      // Data has been refreshed in the backend
    } catch (error) {
      console.error('Error refreshing skills cache:', error);
      // Continue with fetching skills anyway to show existing data
    }
  };

  // Helper function to fetch skills for a specific subject
  const fetchSkills = async (subjectId, setDomains, initialDomains) => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (!session) {
        console.log('No session found, redirecting to login')
        router.push('/login')
        return
      }

      // First refresh the skills cache to include test answers
      await refreshSkillsCache(subjectId);

      // Get performance data from user_skill_analytics
      const { data: performance, error } = await supabase
        .from('user_skill_analytics')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('subject_id', subjectId)

      if (error) {
        console.error(`Error fetching skill analytics for subject ${subjectId}:`, error)
        setError('Failed to fetch skill analytics')
        return
      }

      // Get all domains and their subcategories for this subject
      const { data: domainsData, error: domainsError } = await supabase
        .from('domains')
        .select(`
          id,
          domain_name,
          subcategories (
            id,
            subcategory_name
          )
        `)
        .eq('subject_id', subjectId)

      if (domainsError) {
        console.error(`Error fetching domains for subject ${subjectId}:`, domainsError)
        setError('Failed to fetch domains')
        return
      }

      // Build a map of domain name to skills for easier lookup
      const domainSkillsMap = {};
      
      domainsData.forEach(domain => {
        domainSkillsMap[domain.domain_name] = domain.subcategories.map(subcategory => {
          const skillPerf = performance?.find(p => 
            p.domain_id === domain.id && 
            p.subcategory_id === subcategory.id
          ) || {
            total_attempts: 0,
            correct_attempts: 0,
            last_practiced: null,
            mastery_level: 'Not Started'
          }

          // Calculate accuracy percentage
          const accuracy = skillPerf.total_attempts > 0 
            ? Math.round((skillPerf.correct_attempts / skillPerf.total_attempts) * 100)
            : 0

          // Get the icon component or use a fallback
          const IconComponent = categoryIcons[subcategory.subcategory_name] || (
            subjectId === 1 ? Calculator : BookOpen
          )
          
          // Use the consistent mastery calculation function instead of relying on DB value
          // This ensures UI shows the correct mastery level even if DB hasn't been updated
          const masteryLevel = calculateMasteryLevel(accuracy, skillPerf.total_attempts);
          
          return {
            name: subcategory.subcategory_name,
            icon: <IconComponent size={20} color="#4f46e5" />,
            needsPractice: masteryLevel === 'Needs Work' || masteryLevel === 'Needs More Attempts',
            accuracy: accuracy,
            lastPracticed: skillPerf.last_practiced ? 
              new Date(skillPerf.last_practiced).toLocaleDateString() : 
              'Never practiced',
            progress: accuracy,
            mastery: masteryLevel
          }
        });
      });

      // Merge skills into the initial domains
      const updatedDomains = initialDomains.map(domain => ({
        ...domain,
        skills: domainSkillsMap[domain.name] || []
      }));

      setDomains(updatedDomains)
    } catch (error) {
      console.error(`Error in fetchSkills for subject ${subjectId}:`, error)
      setError('An error occurred while fetching skills data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeSubject === "math") {
      fetchSkills(1, setMathDomains, mathDomainData)
    } else if (activeSubject === "reading") {
      fetchSkills(2, setReadingDomains, readingDomainData)
    }
  }, [activeSubject, router])

  // Get the domains based on active subject
  const domains = activeSubject === "reading" ? readingDomains : mathDomains
  
  // Generate a placeholder loading skill
  const getLoadingSkill = (index) => ({
    name: `Loading Skill ${index + 1}`,
    isLoading: true
  });

  // Generate loading skills for each domain
  const getLoadingSkills = (count) => 
    Array(count).fill().map((_, index) => getLoadingSkill(index));

  return (
    <div style={styles.container}>
      <SkillsHeader title={"PSAT Skills"}/>
      <SubjectTabs activeSubject={activeSubject} onSubjectChange={setActiveSubject} />
      
      <SubscriptionCheck>
        <div style={styles.content}>
          {error ? (
            <div style={styles.errorContainer}>
              <div style={styles.errorMessage}>Error: {error}</div>
              <button 
                style={styles.retryButton}
                onClick={() => {
                  setLoading(true);
                  if (activeSubject === "math") {
                    fetchSkills(1, setMathDomains, mathDomainData);
                  } else {
                    fetchSkills(2, setReadingDomains, readingDomainData);
                  }
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            domains.map((domain) => (
              <DomainSection key={domain.name} domain={domain}>
                {loading ? 
                  // Display the exact number of loading cards based on domain.loadingCount
                  Array(domain.loadingCount).fill().map((_, index) => (
                    <div key={`loading-skill-${index}`} style={styles.loadingCard}>
                      <div style={styles.loadingHeader}>
                        <div style={styles.loadingIcon}></div>
                        <div style={styles.loadingTitle}></div>
                      </div>
                      <div style={styles.loadingStats}>
                        <div style={styles.loadingLine}></div>
                        <div style={styles.loadingLine}></div>
                        <div style={styles.loadingLine}></div>
                      </div>
                      <div style={styles.loadingFooter}></div>
                    </div>
                  ))
                  :
                  // Show actual skills if available or a message if none
                  domain.skills.length > 0 ? 
                    domain.skills.map((skill) => (
                      <SkillCard
                        key={skill.name}
                        skill={skill}
                        subject={activeSubject === "math" ? "Math" : "Reading & Writing"}
                      />
                    ))
                    :
                    <div style={styles.noSkillsMessage}>
                      No skills available for this domain
                    </div>
                }
              </DomainSection>
            ))
          )}
        </div>
      </SubscriptionCheck>
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
    maxWidth: "1400px",
    margin: "0 auto",
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px",
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    marginTop: "24px",
  },
  errorMessage: {
    color: "#dc2626",
    marginBottom: "16px",
    fontWeight: "500",
  },
  retryButton: {
    padding: "8px 16px",
    backgroundColor: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "500",
  },
  loadingCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    height: '160px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    borderLeft: '3px solid #e5e7eb'
  },
  loadingHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  loadingIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#e5e7eb',
    animation: 'pulse 1.5s infinite ease-in-out',
  },
  loadingTitle: {
    height: '20px',
    width: '70%',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    animation: 'pulse 1.5s infinite ease-in-out',
  },
  loadingStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  loadingLine: {
    height: '14px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    animation: 'pulse 1.5s infinite ease-in-out',
  },
  loadingFooter: {
    height: '16px',
    width: '40%',
    marginLeft: 'auto',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    marginTop: '16px',
    animation: 'pulse 1.5s infinite ease-in-out',
  },
  noSkillsMessage: {
    padding: '24px',
    textAlign: 'center',
    color: '#6b7280',
    gridColumn: '1 / -1',
    fontStyle: 'italic'
  }
}

