"use client"
import { useState } from "react"
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

export default function SkillsPage() {
  const [activeSubject, setActiveSubject] = useState("reading")

  const mathDomains = [
    {
      name: "Algebra",
      distribution: "≈35%",
      questions: "15-17 questions",
      skills: [
        {
          name: "Linear Equations",
          icon: <Function size={20} color="#4f46e5" />,
          needsPractice: true,
          accuracy: 70,
          lastPracticed: "3 days ago",
          progress: 70,
        },
        {
          name: "Systems of Equations",
          icon: <PieChart size={20} color="#ef4444" />,
          needsPractice: false,
          accuracy: 85,
          lastPracticed: "1 day ago",
          progress: 85,
        },
      ],
    },
    {
      name: "Advanced Math",
      distribution: "≈35%",
      questions: "15-17 questions",
      skills: [
        {
          name: "Quadratic Equations",
          icon: <Function size={20} color="#8b5cf6" />,
          needsPractice: true,
          accuracy: 68,
          lastPracticed: "4 days ago",
          progress: 68,
        },
        {
          name: "Exponential Functions",
          icon: <Calculator size={20} color="#ec4899" />,
          needsPractice: false,
          accuracy: 80,
          lastPracticed: "2 days ago",
          progress: 80,
        },
      ],
    },
    {
      name: "Problem Solving",
      distribution: "≈30%",
      questions: "13-15 questions",
      skills: [
        {
          name: "Geometry & Trigonometry",
          icon: <Shapes size={20} color="#14b8a6" />,
          needsPractice: true,
          accuracy: 72,
          lastPracticed: "3 days ago",
          progress: 72,
        },
        {
          name: "Data Analysis",
          icon: <PieChart size={20} color="#f43f5e" />,
          needsPractice: false,
          accuracy: 88,
          lastPracticed: "1 day ago",
          progress: 88,
        },
      ],
    },
  ]

  const domains = activeSubject === "reading" ? readingDomains : mathDomains

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
                onClick={() => console.log(`Navigate to ${skill.name} practice`)}
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

