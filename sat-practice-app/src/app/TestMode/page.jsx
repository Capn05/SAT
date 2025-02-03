"use client"

import { useState, useEffect } from "react"
import { Bookmark, ChevronLeft, ChevronRight, Eye, MoreVertical, Flag } from "lucide-react"
import { formatTime } from "../lib/utils"
import "./test.css"
import TopBar from "../components/TopBar"
import { useRouter, useSearchParams } from 'next/navigation'

const mockQuestions = [
  {
    id: 1,
    passage:
      "Researchers and conservationists stress that biodiversity loss due to invasive species is _____. For example, people can take simple steps such as washing their footwear after travel to avoid introducing potentially invasive organisms into new environments.",
    text: "Which choice completes the text with the most logical and precise word or phrase?",
    choices: [
      { id: "A", text: "preventable" },
      { id: "B", text: "undeniable" },
      { id: "C", text: "common" },
      { id: "D", text: "concerning" },
    ],
  },
  // Add more mock questions as needed
]

export default function TestPage({ params }) {
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [timeRemaining, setTimeRemaining] = useState(params.type === "math" ? 4200 : 3840) // 70 or 64 minutes
  const [answers, setAnswers] = useState({})
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set())
  const [showQuestionNav, setShowQuestionNav] = useState(false)
  const totalQuestions = params.type === "math" ? 44 : 54
  const router = useRouter()
  const searchParams = useSearchParams()
  const testId = searchParams.get('testId')
  const [questions, setQuestions] = useState([])

  useEffect(() => {
    if (testId) {
      console.log("Test ID:", testId)
    }
  }, [testId])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchQuestions = async () => {
      const response = await fetch(`/api/fetch-test-questions?testId=${testId}`);
      const data = await response.json();
      console.log("qestions"+ JSON.stringify)
      if (response.ok) {
        setQuestions(data);
      } else {
        console.error('Error fetching questions:', data.error);
      }
    };

    if (testId) {
      fetchQuestions();
    }
  }, [testId]);

  const handleAnswer = (questionId, choice) => {
    setAnswers((prev) => ({ ...prev, [questionId]: choice }))
  }

  const toggleFlagged = (questionId) => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const getQuestionStatus = (questionId) => {
    if (questionId === currentQuestion) return "current"
    if (flaggedQuestions.has(questionId)) return "flagged"
    if (answers[questionId]) return "answered"
    return "unanswered"
  }

  // Function to parse question text
  const parseQuestionText = (text) => {
    if (!text) return { passage: '', question: '' }; // Handle undefined text
    const parts = text.split(/<br\s*\/?>/i); // Split by <br> tag
    const passage = parts[0]; // Everything before the <br>
    const question = parts[1] ? parts[1] : ''; // Everything after the <br>, or empty if not present
    return { passage, question };
  };

  return (
    <div className="test-container">
      <TopBar title="Test 1, Module 1: Reading and Writing" />

      <div className="main-content">
        <div className="content-card">
          {/* Parse the question text */}
          {(() => {
            const { passage, question } = parseQuestionText(questions[currentQuestion - 1]?.question_text);
            return (
              <>
                <p className="passage">{passage}</p>
              </>
            );
          })()}
        </div>

        <div className="content-card">
          <div className="question-header">
            <div className="question-number">{currentQuestion}</div>
            <button
              onClick={() => toggleFlagged(currentQuestion)}
              className={`bookmark-button ${flaggedQuestions.has(currentQuestion) ? "flagged" : ""}`}
            >
              <Bookmark className="w-5 h-5" />
            </button>
          </div>
          {(() => {
            const { passage, question } = parseQuestionText(questions[currentQuestion - 1]?.question_text);
            return (
              <>
                <p className="question-text">{question}</p>
              </>
            );
          })()}
          <div className="choices">
            {questions[currentQuestion - 1]?.options.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleAnswer(currentQuestion, choice.id)}
                className={`choice-button ${answers[currentQuestion] === choice.id ? "selected" : ""}`}
              >
                <span className="choice-letter">{choice.value}.</span> {choice.text}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showQuestionNav && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Section 1, Module 1: Questions</h2>
              <button onClick={() => setShowQuestionNav(false)} className="modal-close">
                ×
              </button>
            </div>

            <div className="question-status-legend">
              <div className="status-item">
                <div className="status-indicator status-current" />
                Current
              </div>
              <div className="status-item">
                <div className="status-indicator status-unanswered" />
                Unanswered
              </div>
              <div className="status-item">
                <Flag className="w-4 h-4 text-[#4338ca]" />
                For Review
              </div>
            </div>

            <div className="question-grid">
              {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    setCurrentQuestion(num)
                    setShowQuestionNav(false)
                  }}
                  className={`grid-button ${getQuestionStatus(num)}`}
                >
                  {num}
                </button>
              ))}
            </div>

            <button onClick={() => setShowQuestionNav(false)} className="review-button">
              Go to Review Page
            </button>
          </div>
        </div>
      )}

      <div className="bottom-nav">
        <div className="bottom-nav-content">
          <div className="question-info">
            <span className="question-count">
              Question {currentQuestion} of {totalQuestions}
            </span>
            <button onClick={() => setShowQuestionNav(true)} className="view-all-button">
              View All Questions
            </button>
          </div>
          <div className="nav-buttons">
            <button
              onClick={() => setCurrentQuestion((prev) => Math.max(1, prev - 1))}
              disabled={currentQuestion === 1}
              className="nav-button"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentQuestion((prev) => Math.min(totalQuestions, prev + 1))}
              disabled={currentQuestion === totalQuestions}
              className="nav-button"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

