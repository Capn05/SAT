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

export const readingDomains = [
  {
    name: "Information and Ideas",
    distribution: "≈26%",
    questions: "12-14 questions",
    skills: [
      {
        name: "Central Ideas and Details",
        icon: <Brain size={20} color="#4f46e5" />,
        needsPractice: true,
        accuracy: 0,
        lastPracticed: "Never practiced",
        progress: 0,
        mastery: "Not Started",
        description: "Students will determine the central idea of a text and/or interpret the key details supporting that idea.",
      },
      {
        name: "Command of Evidence (Textual)",
        icon: <FileText size={20} color="#4f46e5" />,
        needsPractice: true,
        accuracy: 0,
        lastPracticed: "Never practiced",
        progress: 0,
        mastery: "Not Started",
        description: "Students will determine the textual evidence that best supports a specified claim or point.",
      },
      {
        name: "Command of Evidence (Quantitative)",
        icon: <Calculator size={20} color="#4f46e5" />,
        needsPractice: true,
        accuracy: 0,
        lastPracticed: "Never practiced",
        progress: 0,
        mastery: "Not Started",
        description: "Students will determine the quantitative evidence that best supports a specified claim or point.",
      },
      {
        name: "Inferences",
        icon: <Lightbulb size={20} color="#4f46e5" />,
        needsPractice: true,
        accuracy: 0,
        lastPracticed: "Never practiced",
        progress: 0,
        mastery: "Not Started",
        description: "Students will draw reasonable inferences based on explicit and/or implicit information and ideas in a text.",
      },
    ],
  },
  {
    name: "Craft and Structure",
    distribution: "≈28%",
    questions: "13-15 questions",
    skills: [
      {
        name: "Words in Context",
        icon: <BookOpen size={20} color="#4f46e5" />,
        needsPractice: true,
        accuracy: 0,
        lastPracticed: "Never practiced",
        progress: 0,
        mastery: "Not Started",
        description: "Students will determine the meaning of a high-utility academic word or phrase in context or use such vocabulary in a contextually appropriate way.",
      },
      {
        name: "Text Structure and Purpose",
        icon: <GanttChart size={20} color="#4f46e5" />,
        needsPractice: true,
        accuracy: 0,
        lastPracticed: "Never practiced",
        progress: 0,
        mastery: "Not Started",
        description: "Students will analyze the structure of a text or determine the main rhetorical purpose of a text.",
      },
      {
        name: "Cross-Text Connections",
        icon: <Connection size={20} color="#4f46e5" />,
        needsPractice: true,
        accuracy: 0,
        lastPracticed: "Never practiced",
        progress: 0,
        mastery: "Not Started",
        description: "Students will draw reasonable connections between two texts on related topics.",
      },
    ],
  },
  {
    name: "Expression of Ideas",
    distribution: "≈20%",
    questions: "8-12 questions",
    skills: [
      {
        name: "Rhetorical Synthesis",
        icon: <Puzzle size={20} color="#4f46e5" />,
        needsPractice: true,
        accuracy: 0,
        lastPracticed: "Never practiced",
        progress: 0,
        mastery: "Not Started",
        description: "Students will strategically integrate information and ideas on a topic to form an effective sentence achieving a specified rhetorical aim.",
      },
      {
        name: "Transitions",
        icon: <ArrowRightLeft size={20} color="#4f46e5" />,
        needsPractice: true,
        accuracy: 0,
        lastPracticed: "Never practiced",
        progress: 0,
        mastery: "Not Started",
        description: "Students will determine the most effective transition word or phrase to logically connect information and ideas in a text.",
      },
    ],
  },
  {
    name: "Standard English Conventions",
    distribution: "≈26%",
    questions: "11-15 questions",
    skills: [
      {
        name: "Boundaries",
        icon: <Connection size={20} color="#4f46e5" />,
        needsPractice: true,
        accuracy: 0,
        lastPracticed: "Never practiced",
        progress: 0,
        mastery: "Not Started",
        description: "Students will use contextually appropriate punctuation to properly mark the end of a sentence.",
      },
      {
        name: "Form, Structure, and Sense",
        icon: <Pencil size={20} color="#4f46e5" />,
        needsPractice: true,
        accuracy: 0,
        lastPracticed: "Never practiced",
        progress: 0,
        mastery: "Not Started",
        description: "Students will ensure agreement in number between a subject and a verb.",
      },
    ],
  },
]
