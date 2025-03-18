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

// Hard-coded SAT distribution percentages and question counts
const satDistributions = {
  // Reading & Writing distributions
  "Craft and Structure": { percentage: 28, questions: "13-15" },
  "Information and Ideas": { percentage: 26, questions: "12-14" },
  "Standard English Conventions": { percentage: 26, questions: "11-15" },
  "Expression of Ideas": { percentage: 20, questions: "8-12" },
  
  // Math distributions (using approximate values based on standard SAT)
  "Algebra": { percentage: 35, questions: "13-15" },
  "Problem-Solving and Data Analysis": { percentage: 15, questions: "5-7" },
  "Advanced Math": { percentage: 35, questions: "13-15" },
  "Geometry and Trigonometry": { percentage: 15, questions: "5-7" }
};

export default function SkillsPage() {
  const [activeSubject, setActiveSubject] = useState("reading")
  const [mathDomains, setMathDomains] = useState([])
  const [readingDomains, setReadingDomains] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

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
  const fetchSkills = async (subjectId, setDomains) => {
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

      // Transform the data into the format expected by the UI
      const domains = domainsData.map(domain => {
        const skills = domain.subcategories.map(subcategory => {
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
          
          return {
            name: subcategory.subcategory_name,
            icon: <IconComponent size={20} color="#4f46e5" />,
            needsPractice: skillPerf.total_attempts < 5 || skillPerf.mastery_level === 'needs_work',
            accuracy: accuracy,
            lastPracticed: skillPerf.last_practiced ? 
              new Date(skillPerf.last_practiced).toLocaleDateString() : 
              'Never practiced',
            progress: accuracy,
            mastery: skillPerf.mastery_level === 'Not Started' ? 'Not Started' : 
              skillPerf.mastery_level === 'needs_work' ? 'Needs Work' :
              skillPerf.mastery_level === 'improving' ? 'Improving' :
              skillPerf.mastery_level === 'proficient' ? 'Proficient' :
              skillPerf.mastery_level === 'mastered' ? 'Mastered' : 
              'Not Started'
          }
        })

        return {
          name: domain.domain_name,
          distribution: satDistributions[domain.domain_name]?.percentage 
            ? `≈${satDistributions[domain.domain_name].percentage}%` 
            : "N/A",
          questions: satDistributions[domain.domain_name]?.questions 
            ? satDistributions[domain.domain_name].questions + " questions" 
            : `${Math.round(skills.length * 0.9)}-${skills.length} questions`,
          skills
        }
      })

      setDomains(domains)
    } catch (error) {
      console.error(`Error in fetchSkills for subject ${subjectId}:`, error)
      setError('An error occurred while fetching skills data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeSubject === "math") {
      fetchSkills(1, setMathDomains)
    } else if (activeSubject === "reading") {
      fetchSkills(2, setReadingDomains)
    }
  }, [activeSubject, router])

  const domains = activeSubject === "reading" ? readingDomains : mathDomains

  if (loading) {
    return <div style={styles.container}>Loading skills data...</div>
  }

  if (error) {
    return <div style={styles.container}>Error: {error}</div>
  }

  return (
    <div style={styles.container}>
      <SkillsHeader title={"SAT Skills"}/>
      <SubjectTabs activeSubject={activeSubject} onSubjectChange={setActiveSubject} />
      
      <div style={styles.content}>
        {domains.map((domain) => (
          <DomainSection key={domain.name} domain={domain}>
            {domain.skills.map((skill) => (
              <SkillCard
                key={skill.name}
                skill={skill}
                subject={activeSubject === "math" ? "Math" : "Reading & Writing"}
              />
            ))}
          </DomainSection>
        ))}
      </div>
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
}

