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
  CircleSquare,
  Box,
  PenTool,
  Flask,
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
  'Circles': CircleSquare,
  'Area and Volume': Box,
  
  // Reading Categories
  'Information and Ideas': BookOpen,
  'Craft and Structure': FileText,
  'Expression of Ideas': PenTool,
  'Standard English Conventions': Flask,
  
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
  'Boundaries': Flask,
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

      // Get performance data
      const { data: performance, error } = await supabase
        .from('skill_performance')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('subject_id', subjectId.toString())

      if (error) {
        console.error(`Error fetching skill performance for subject ${subjectId}:`, error)
        setError('Failed to fetch skill performance')
        return
      }

      // Get all available questions for this subject
      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('subject_id, main_category, subcategory')
        .eq('subject_id', subjectId.toString())

      if (questionsError) {
        console.error(`Error fetching questions for subject ${subjectId}:`, questionsError)
        setError('Failed to fetch questions')
        return
      }

      // Group questions by main category and subcategory
      const groupedData = questions.reduce((acc, q) => {
        if (!q.main_category || !q.subcategory) return acc
        
        if (!acc[q.main_category]) {
          acc[q.main_category] = {
            name: q.main_category,
            skills: new Set(),
            count: 0
          }
        }
        acc[q.main_category].skills.add(q.subcategory)
        acc[q.main_category].count++
        return acc
      }, {})
      
      // Transform into final format with performance data and hard-coded distributions
      const domains = Object.entries(groupedData).map(([category, data]) => {
        // Use hard-coded distribution if available, otherwise use a default
        const distribution = satDistributions[category] 
          ? `≈${satDistributions[category].percentage}%` 
          : "N/A";
          
        // Use hard-coded question count if available, otherwise use count from database
        const questionCount = satDistributions[category] 
          ? satDistributions[category].questions + " questions" 
          : `${Math.round(data.count * 0.9)}-${data.count} questions`;
          
        const skills = Array.from(data.skills).map(subcategory => {
          const skillPerf = performance?.find(p => 
            p.main_category === category && 
            p.subcategory === subcategory
          ) || {
            accuracy_percentage: 0,
            last_attempt_at: null,
            mastery_level: 'Not Started',
            total_attempts: 0
          }

          // Get the icon component or use a fallback
          const IconComponent = categoryIcons[subcategory] || (
            subjectId === 1 ? Calculator : BookOpen
          )
          
          return {
            name: subcategory,
            icon: <IconComponent size={20} color="#4f46e5" />,
            needsPractice: skillPerf.total_attempts < 5 || skillPerf.mastery_level === 'Needs Practice',
            accuracy: skillPerf.accuracy_percentage || 0,
            lastPracticed: skillPerf.last_attempt_at ? 
              new Date(skillPerf.last_attempt_at).toLocaleDateString() : 
              'Never practiced',
            progress: skillPerf.accuracy_percentage || 0,
            mastery: skillPerf.mastery_level || 'Not Started'
          }
        })

        return {
          name: category,
          distribution: distribution,
          questions: questionCount,
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
      fetchSkills(4, setReadingDomains)
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
    backgroundColor: "white",
  },
  content: {
    padding: "24px",
    maxWidth: "1400px",
    margin: "0 auto",
  },
}

