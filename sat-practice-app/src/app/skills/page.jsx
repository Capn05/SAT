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
} from "lucide-react"
import SkillsHeader from "../components/TopBar"
import SkillCard from "./components/SkillCard"
import DomainSection from "./components/DomainSection"
import SubjectTabs from "./components/SubjectTabs"
import './styles.css'; // Adjust the path as necessary
import { readingDomains } from './domains'; // Adjust the path as necessary
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

const categoryIcons = {
  // Math Categories
  'Algebra': Calculator,
  'Advanced Math': Function,
  'Problem Solving': Brain,
  // Math Subcategories
  'Linear Equations': Calculator,
  'Systems of Equations': Connection,
  'Quadratic Equations': Function,
  'Exponential Functions': PieChart,
  'Geometry & Trigonometry': Shapes,
  'Data Analysis': PieChart,
  // Reading Categories
  'Information and Ideas': BookOpen,
  'Craft and Structure': FileText,
  'Expression of Ideas': Pencil,
  'Standard English Conventions': GanttChart,
  // Reading Subcategories
  'Central Ideas and Details': BookOpen,
  'Command of Evidence (Textual)': FileText,
  'Command of Evidence (Quantitative)': PieChart,
  'Inferences': Lightbulb,
  'Words in Context': Pencil,
  'Text Structure and Purpose': Connection,
  'Cross-Text Connections': Connection,
  'Rhetorical Synthesis': Puzzle,
  'Transitions': ArrowRightLeft,
  'Boundaries': GanttChart,
  'Form, Structure, and Sense': Shapes
};

export default function SkillsPage() {
  const [activeSubject, setActiveSubject] = useState("reading")
  const [mathDomains, setMathDomains] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchMathSkills = async () => {
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
          .eq('subject_id', '1') // 1 is for Math

        if (error) {
          console.error('Error fetching skill performance:', error)
          setError('Failed to fetch skill performance')
          return
        }

        // Get all available math questions to ensure we show all categories
        const { data: questions, error: questionsError } = await supabase
          .from('questions')
          .select('subject_id, main_category, subcategory')
          .eq('subject_id', '1') // 1 is for Math

        if (questionsError) {
          console.error('Error fetching questions:', questionsError)
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

        // Calculate distribution percentages
        const totalQuestions = Object.values(groupedData).reduce((sum, domain) => sum + domain.count, 0)
        
        // Transform into final format with performance data
        const domains = Object.entries(groupedData).map(([category, data]) => {
          const distribution = Math.round((data.count / totalQuestions) * 100)
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

            const IconComponent = categoryIcons[subcategory]
            
            return {
              name: subcategory,
              icon: IconComponent ? <IconComponent size={20} color="#4f46e5" /> : null,
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
            distribution: `≈${distribution}%`,
            questions: `${Math.round(data.count * 0.9)}-${data.count} questions`,
            skills
          }
        })

        setMathDomains(domains)
      } catch (error) {
        console.error('Error in fetchMathSkills:', error)
        setError('An error occurred while fetching skills data')
      } finally {
        setLoading(false)
      }
    }

    if (activeSubject === "math") {
      fetchMathSkills()
    }
  }, [activeSubject, router])

  const domains = activeSubject === "reading" ? readingDomains : mathDomains

  if (loading && activeSubject === "math") {
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

