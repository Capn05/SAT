"use client"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import TopBar from '../components/TopBar'
import ReviewAIChat from '../components/ReviewAIChat'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import './review.css'

export default function ReviewTestPage() {
  const [questions, setQuestions] = useState([])
  const [userAnswers, setUserAnswers] = useState([])
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const searchParams = useSearchParams()
  const testId = searchParams.get('testId')

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        // Fetch questions using the existing API route
        const questionsResponse = await fetch(`/api/fetch-test-questions?testId=${testId}`)
        const questionsData = await questionsResponse.json()
        
        // Fetch user answers
        const { data: userAnswersData, error: answersError } = await supabase
          .from('official_user_answers')
          .select('*')
          .eq('test_id', testId)
          .eq('user_id', user.id)

        if (answersError) throw answersError

        // Match questions with user answers
        const matchedQuestions = questionsData.map(question => {
          const userAnswer = userAnswersData.find(answer => answer.question_id === question.id)
          return {
            ...question,
            userAnswer: userAnswer || null
          }
        })

        // Calculate metrics
        const totalQuestions = matchedQuestions.length
        const correctAnswers = userAnswersData.filter(a => a.is_correct).length
        const incorrectAnswers = totalQuestions - correctAnswers
        const accuracy = (correctAnswers / totalQuestions) * 100

        // Group questions by topic/skill
        const topicPerformance = matchedQuestions.reduce((acc, question) => {
          const topic = question.topic || 'Unknown'
          if (!acc[topic]) {
            acc[topic] = { total: 0, correct: 0 }
          }
          acc[topic].total++
          if (question.userAnswer?.is_correct) acc[topic].correct++
          return acc
        }, {})

        setMetrics({
          accuracy,
          correctAnswers,
          incorrectAnswers,
          topicPerformance
        })

        setQuestions(matchedQuestions)
        setUserAnswers(userAnswersData)
        
        // Generate study suggestions
        const weakTopics = Object.entries(topicPerformance)
          .filter(([_, stats]) => (stats.correct / stats.total) < 0.7)
          .map(([topic]) => topic)

        setSuggestions(weakTopics.map(topic => ({
          topic,
          resources: [
            `Review the fundamentals of ${topic}`,
            `Practice more ${topic} questions`,
            `Watch video tutorials on ${topic}`
          ]
        })))

      } catch (error) {
        console.error('Error fetching test data:', error)
      }
    }

    if (testId) {
      fetchTestData()
    }
  }, [testId])

  // Add the parseQuestionText function from TestMode
  const parseQuestionText = (text) => {
    if (!text) return { passage: '', question: '' };
    const parts = text.split(/<br\s*\/?>/i);
    const passage = parts[0];
    const question = parts[1] ? parts[1] : '';
    return { passage, question };
  };

  return (
    <div className="review-container">
      <TopBar title="Test Review" />
      
      <div className="review-content">
        <div className="metrics-section">
          <h2>Performance Overview</h2>
          <div className="metrics-grid">
            <div className="metric-card">
              <h3>Overall Accuracy</h3>
              <div className="metric-value">{metrics?.accuracy.toFixed(1)}%</div>
            </div>
            <div className="metric-card">
              <h3>Questions</h3>
              <div className="metric-details">
                <p>Correct: {metrics?.correctAnswers}</p>
                <p>Incorrect: {metrics?.incorrectAnswers}</p>
              </div>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={Object.entries(metrics?.topicPerformance || {}).map(([topic, stats]) => ({
                topic,
                accuracy: (stats.correct / stats.total) * 100
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="topic" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="accuracy" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="questions-section">
          <h2>Review Questions</h2>
          <div className="questions-grid">
            {questions.map((question, index) => (
              <button
                key={question.id}
                className={`question-card ${question.userAnswer?.is_correct ? 'correct' : 'incorrect'}`}
                onClick={() => setSelectedQuestion(index)}
              >
                <span className="question-number">Question {index + 1}</span>
                <span className="status-indicator">
                  {question.userAnswer?.is_correct ? '✓' : '✗'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {selectedQuestion !== null && (
          <div className="main-content">
            <div className="content-card">
              {(() => {
                const { passage, question } = parseQuestionText(questions[selectedQuestion].question_text);
                return <p className="passage">{passage}</p>;
              })()}
            </div>

            <div className="content-card">
              <div className="question-header">
                <div className="question-number">Question {selectedQuestion + 1}</div>
              </div>
              {(() => {
                const { passage, question } = parseQuestionText(questions[selectedQuestion].question_text);
                return <p className="question-text">{question}</p>;
              })()}
              <div className="choices">
                {questions[selectedQuestion].options.map((option) => (
                  <div
                    key={option.id}
                    className={`choice-button ${option.isCorrect ? 'correct' : ''} ${questions[selectedQuestion].userAnswer?.option_id === option.id ? 'selected' : ''}`}
                  >
                    <span className="choice-letter">{option.value}.</span> {option.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="content-card">
              <div className="ai-chat">
                <ReviewAIChat 
                  question={questions[selectedQuestion].question_text}
                  selectedAnswer={questions[selectedQuestion].userAnswer?.option_id}
                  options={questions[selectedQuestion].options}
                  imageURL={questions[selectedQuestion].image_url}
                />
              </div>
            </div>
          </div>
        )}

        <div className="suggestions-section">
          <h2>Study Suggestions</h2>
          {suggestions.map((suggestion, index) => (
            <div key={index} className="suggestion-card">
              <h3>{suggestion.topic}</h3>
              <ul>
                {suggestion.resources.map((resource, i) => (
                  <li key={i}>{resource}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 