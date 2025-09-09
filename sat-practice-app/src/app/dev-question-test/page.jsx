'use client'
import { useState, useEffect } from 'react';
import { renderMathContent, processTableFormat } from '../components/MathRenderer';
import MarkdownIt from 'markdown-it';
import markdownItKatex from 'markdown-it-katex';
import 'katex/dist/katex.min.css';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true,
}).use(markdownItKatex);

md.enable('table');

export default function DevQuestionTest() {
  const [questionId, setQuestionId] = useState('');
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // New state for bulk query
  const [subcategoryId, setSubcategoryId] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [questions, setQuestions] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [activeTab, setActiveTab] = useState('single'); // 'single' or 'bulk'
  
  // New state for subcategories dropdown
  const [subcategories, setSubcategories] = useState([]);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  // Helper function to determine if question is math
  const isMathQuestion = (question) => {
    return question && question.subjectId === 1; // Math questions have subject_id of 1
  };

  // Main rendering function for all content
  const renderResponse = (response, question) => {
    if (!response) return '';
    
    // Normalize underscores
    response = response.replace(/_{6,}/g, '_____');
    
    // Different rendering for Math vs Reading & Writing
    if (isMathQuestion(question)) {
      // Use the renderMathContent function from MathRenderer for math questions
      return renderMathContent(response);
    } else {
      // For reading/writing questions, first process table format
      response = processTableFormat(response);
      // Then use markdown-it for rendering
      return md.render(response);
    }
  };

  const fetchQuestion = async () => {
    if (!questionId.trim()) {
      setError('Please enter a question ID');
      return;
    }

    setLoading(true);
    setError('');
    setQuestion(null);

    try {
      const response = await fetch(`/api/question-by-id?id=${encodeURIComponent(questionId.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setQuestion(data);
    } catch (err) {
      console.error('Error fetching question:', err);
      setError(err.message || 'Failed to fetch question');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchQuestion();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      fetchQuestion();
    }
  };

  const fetchSubcategories = async () => {
    setSubcategoriesLoading(true);
    try {
      const response = await fetch('/api/subcategories');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setSubcategories(data.subcategories || []);
    } catch (err) {
      console.error('Error fetching subcategories:', err);
      setBulkError(err.message || 'Failed to fetch subcategories');
    } finally {
      setSubcategoriesLoading(false);
    }
  };

  const fetchQuestionsByCriteria = async () => {
    if (!selectedSubcategory) {
      setBulkError('Please select a subcategory');
      return;
    }

    setBulkLoading(true);
    setBulkError('');
    setQuestions([]);

    try {
      const params = new URLSearchParams({
        subcategory_id: selectedSubcategory
      });
      
      if (difficulty && difficulty !== 'all') {
        params.append('difficulty', difficulty);
      }

      const response = await fetch(`/api/questions-by-criteria?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setQuestions(data.questions || []);
      
      if (data.questions && data.questions.length === 0) {
        const selectedSubcategoryName = subcategories.find(s => s.id.toString() === selectedSubcategory)?.name || selectedSubcategory;
        setBulkError(`No questions found for subcategory "${selectedSubcategoryName}"${difficulty && difficulty !== 'all' ? ` with difficulty ${difficulty}` : ''}`);
      }
    } catch (err) {
      console.error('Error fetching questions by criteria:', err);
      setBulkError(err.message || 'Failed to fetch questions');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkSubmit = (e) => {
    e.preventDefault();
    fetchQuestionsByCriteria();
  };

  // Fetch subcategories when bulk tab is activated
  useEffect(() => {
    if (activeTab === 'bulk' && subcategories.length === 0 && !subcategoriesLoading) {
      fetchSubcategories();
    }
  }, [activeTab, subcategories.length, subcategoriesLoading]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🔧 Developer Question Testing Tool</h1>
        <p style={styles.subtitle}>
          Query questions by ID or find all questions by subcategory and difficulty
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={styles.tabContainer}>
        <button
          style={{
            ...styles.tabButton,
            ...(activeTab === 'single' ? styles.activeTab : styles.inactiveTab)
          }}
          onClick={() => setActiveTab('single')}
        >
          🔍 Single Question
        </button>
        <button
          style={{
            ...styles.tabButton,
            ...(activeTab === 'bulk' ? styles.activeTab : styles.inactiveTab)
          }}
          onClick={() => setActiveTab('bulk')}
        >
          📋 Bulk Query
        </button>
      </div>

      {/* Single Question Search */}
      {activeTab === 'single' && (
        <div style={styles.searchSection}>
          <form onSubmit={handleSubmit} style={styles.searchForm}>
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="questionId">
                Question ID:
              </label>
              <input
                id="questionId"
                type="text"
                value={questionId}
                onChange={(e) => setQuestionId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter question ID (e.g., 1, 42, 999)"
                style={styles.input}
                disabled={loading}
              />
              <button
                type="submit"
                style={styles.searchButton}
                disabled={loading || !questionId.trim()}
              >
                {loading ? 'Loading...' : 'Fetch Question'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Query Search */}
      {activeTab === 'bulk' && (
        <div style={styles.searchSection}>
          <form onSubmit={handleBulkSubmit} style={styles.searchForm}>
            <div style={styles.bulkInputContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label} htmlFor="subcategory">
                  Subcategory:
                </label>
                <select
                  id="subcategory"
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  style={styles.subcategorySelect}
                  disabled={bulkLoading || subcategoriesLoading}
                >
                  <option value="">
                    {subcategoriesLoading ? 'Loading subcategories...' : 'Select a subcategory'}
                  </option>
                  {subcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label} htmlFor="difficulty">
                  Difficulty:
                </label>
                <select
                  id="difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  style={styles.select}
                  disabled={bulkLoading}
                >
                  <option value="all">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <button
                type="submit"
                style={styles.searchButton}
                disabled={bulkLoading || !selectedSubcategory || subcategoriesLoading}
              >
                {bulkLoading ? 'Loading...' : 'Fetch Questions'}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && activeTab === 'single' && (
        <div style={styles.errorContainer}>
          <h3 style={styles.errorTitle}>Error</h3>
          <p style={styles.errorText}>{error}</p>
        </div>
      )}

      {bulkError && activeTab === 'bulk' && (
        <div style={styles.errorContainer}>
          <h3 style={styles.errorTitle}>Error</h3>
          <p style={styles.errorText}>{bulkError}</p>
        </div>
      )}

      {/* Bulk Results Summary */}
      {activeTab === 'bulk' && questions.length > 0 && (
        <div style={styles.summaryHeader}>
          <h2 style={styles.summaryTitle}>
            📊 Found {questions.length} Question{questions.length !== 1 ? 's' : ''}
          </h2>
          <p style={styles.summarySubtitle}>
            {(() => {
              const selectedSubcategoryObj = subcategories.find(s => s.id.toString() === selectedSubcategory);
              return selectedSubcategoryObj ? selectedSubcategoryObj.displayName : `Subcategory ID: ${selectedSubcategory}`;
            })()}
            {difficulty && difficulty !== 'all' && ` | Difficulty: ${difficulty}`}
          </p>
        </div>
      )}

      {/* Single Question Results */}
      {activeTab === 'single' && question && (
        <div style={styles.questionContainer}>
          {/* Question Metadata */}
          <div style={styles.metadataSection}>
            <h2 style={styles.sectionTitle}>📊 Question Metadata</h2>
            <div style={styles.metadataGrid}>
              <div style={styles.metadataItem}>
                <strong>ID:</strong> {question.id}
              </div>
              <div style={styles.metadataItem}>
                <strong>Subject:</strong> {question.subjectName} (ID: {question.subjectId})
              </div>
              <div style={styles.metadataItem}>
                <strong>Domain:</strong> {question.domainName} (ID: {question.domainId})
              </div>
              <div style={styles.metadataItem}>
                <strong>Subcategory:</strong> {question.subcategoryName} (ID: {question.subcategoryId})
              </div>
              <div style={styles.metadataItem}>
                <strong>Difficulty:</strong> {question.difficulty}
              </div>
              {question.moduleInfo && (
                <>
                  <div style={styles.metadataItem}>
                    <strong>Test Module:</strong> Module {question.moduleInfo.moduleNumber}
                    {question.moduleInfo.isHarder ? ' (Harder)' : ''}
                  </div>
                  <div style={styles.metadataItem}>
                    <strong>Practice Test:</strong> {question.moduleInfo.practiceTestName} 
                    (ID: {question.moduleInfo.practiceTestId})
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Question Content */}
          <div style={styles.questionSection}>
            <h2 style={styles.sectionTitle}>❓ Question</h2>
            <div 
              style={styles.questionText}
              dangerouslySetInnerHTML={{ __html: renderResponse(question.text, question) }}
              className={`question-text-container ${isMathQuestion(question) ? 'math-question' : 'reading-question'}`}
            />
            
            {/* Question Image */}
            {question.imageUrl && (
              <div style={styles.imageContainer}>
                <h3 style={styles.imageTitle}>📷 Question Image</h3>
                <img 
                  src={question.imageUrl} 
                  alt="Question illustration" 
                  style={styles.questionImage}
                  onError={(e) => {
                    console.error('Failed to load image:', question.imageUrl);
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Answer Options */}
          <div style={styles.optionsSection}>
            <h2 style={styles.sectionTitle}>📝 Answer Options</h2>
            <div style={styles.optionsContainer}>
              {question.options.map((option) => (
                <div 
                  key={option.id} 
                  style={{
                    ...styles.optionCard,
                    ...(option.isCorrect ? styles.correctOption : {}),
                  }}
                >
                  <div style={styles.optionHeader}>
                    <div style={styles.optionHeaderLeft}>
                      <span style={styles.optionValue}>{option.value}.</span>
                      <span style={styles.optionId}>ID: {option.id}</span>
                    </div>
                    {option.isCorrect && (
                      <span style={styles.correctBadge}>✅ CORRECT</span>
                    )}
                  </div>
                  <div 
                    style={styles.optionText}
                    dangerouslySetInnerHTML={{ __html: renderResponse(option.text, question) }}
                    className={`question-text-container ${isMathQuestion(question) ? 'math-content' : 'reading-content'}`}
                  />
                  <div style={styles.optionMeta}>
                    Option ID: {option.id} | Value: {option.value} | Correct: {option.isCorrect ? 'Yes' : 'No'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Correct Answer Summary */}
          {question.correctAnswer && (
            <div style={styles.summarySection}>
              <h2 style={styles.sectionTitle}>🎯 Correct Answer</h2>
              <div style={styles.correctAnswerSummary}>
                <strong>Answer {question.correctAnswer.value}:</strong>
                <div 
                  dangerouslySetInnerHTML={{ __html: renderResponse(question.correctAnswer.text, question) }}
                  className={`question-text-container ${isMathQuestion(question) ? 'math-content' : 'reading-content'}`}
                />
              </div>
            </div>
          )}

          {/* Raw Data (for debugging) */}
          <details style={styles.rawDataSection}>
            <summary style={styles.rawDataToggle}>🔍 Raw JSON Data (for debugging)</summary>
            <pre style={styles.rawDataContent}>
              {JSON.stringify(question, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Bulk Questions Results */}
      {activeTab === 'bulk' && questions.length > 0 && (
        <div style={styles.bulkContainer}>
          {questions.map((question, index) => (
            <div key={question.id} style={styles.bulkQuestionCard}>
              {/* Question Header */}
              <div style={styles.bulkQuestionHeader}>
                <h3 style={styles.bulkQuestionTitle}>
                  Question #{index + 1} (ID: {question.id})
                </h3>
                <div style={styles.bulkQuestionMeta}>
                  <span style={styles.metaBadge}>
                    {question.difficulty}
                  </span>
                  <span style={styles.metaBadge}>
                    {question.subjectName}
                  </span>
                  <span style={styles.metaBadge}>
                    {question.subcategoryName} (ID: {question.subcategoryId})
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <div style={styles.bulkQuestionContent}>
                <div 
                  style={styles.bulkQuestionText}
                  dangerouslySetInnerHTML={{ __html: renderResponse(question.text, question) }}
                  className={`question-text-container ${isMathQuestion(question) ? 'math-question' : 'reading-question'}`}
                />
                
                {/* Question Image */}
                {question.imageUrl && (
                  <div style={styles.bulkImageContainer}>
                    <img 
                      src={question.imageUrl} 
                      alt="Question illustration" 
                      style={styles.bulkQuestionImage}
                      onError={(e) => {
                        console.error('Failed to load image:', question.imageUrl);
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Answer Options */}
                <div style={styles.bulkOptionsContainer}>
                  <h4 style={styles.bulkOptionsTitle}>Answer Options:</h4>
                  {question.options.map((option) => (
                    <div 
                      key={option.id} 
                      style={{
                        ...styles.bulkOptionCard,
                        ...(option.isCorrect ? styles.bulkCorrectOption : {}),
                      }}
                    >
                      <div style={styles.bulkOptionHeader}>
                        <div style={styles.optionHeaderLeft}>
                          <span style={styles.bulkOptionValue}>{option.value}.</span>
                          <span style={styles.bulkOptionId}>ID: {option.id}</span>
                        </div>
                        {option.isCorrect && (
                          <span style={styles.bulkCorrectBadge}>✅ CORRECT</span>
                        )}
                      </div>
                      <div 
                        style={styles.bulkOptionText}
                        dangerouslySetInnerHTML={{ __html: renderResponse(option.text, question) }}
                        className={`question-text-container ${isMathQuestion(question) ? 'math-content' : 'reading-content'}`}
                      />
                    </div>
                  ))}
                </div>

                {/* Correct Answer Summary */}
                {question.correctAnswer && (
                  <div style={styles.bulkCorrectSummary}>
                    <strong>✅ Correct Answer: {question.correctAnswer.value}</strong>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#64748b',
    margin: '0',
  },
  searchSection: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  searchForm: {
    display: 'flex',
    justifyContent: 'center',
  },
  tabContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  tabButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    margin: '0 4px',
  },
  activeTab: {
    backgroundColor: '#3b82f6',
    color: 'white',
    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
  },
  inactiveTab: {
    backgroundColor: '#f8fafc',
    color: '#64748b',
    '&:hover': {
      backgroundColor: '#f1f5f9',
      color: '#475569',
    },
  },
  bulkInputContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    alignItems: 'center',
  },
  select: {
    padding: '12px 16px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    minWidth: '200px',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease',
    '&:focus': {
      outline: 'none',
      borderColor: '#3b82f6',
    },
  },
  subcategorySelect: {
    padding: '12px 16px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    minWidth: '400px',
    maxWidth: '600px',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease',
    '&:focus': {
      outline: 'none',
      borderColor: '#3b82f6',
    },
    '&:disabled': {
      backgroundColor: '#f3f4f6',
      cursor: 'not-allowed',
      color: '#6b7280',
    },
  },
  inputGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  label: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#374151',
    minWidth: '100px',
  },
  input: {
    padding: '12px 16px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    minWidth: '250px',
    transition: 'border-color 0.2s ease',
    '&:focus': {
      outline: 'none',
      borderColor: '#3b82f6',
    },
  },
  searchButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#3b82f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#2563eb',
    },
    '&:disabled': {
      backgroundColor: '#9ca3af',
      cursor: 'not-allowed',
    },
  },
  errorContainer: {
    padding: '20px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '12px',
    marginBottom: '30px',
  },
  errorTitle: {
    color: '#dc2626',
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 8px 0',
  },
  errorText: {
    color: '#991b1b',
    fontSize: '16px',
    margin: '0',
  },
  questionContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  metadataSection: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '16px',
    borderBottom: '2px solid #e2e8f0',
    paddingBottom: '8px',
  },
  metadataGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '12px',
  },
  metadataItem: {
    padding: '8px 12px',
    backgroundColor: '#f1f5f9',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#475569',
  },
  questionSection: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  questionText: {
    fontSize: '18px',
    lineHeight: '1.6',
    color: '#1f2937',
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  imageContainer: {
    marginTop: '20px',
  },
  imageTitle: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '12px',
  },
  questionImage: {
    maxWidth: '100%',
    maxHeight: '400px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  optionsSection: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  optionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  optionCard: {
    padding: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#fafafa',
  },
  correctOption: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  optionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  optionHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  optionValue: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
  },
  optionId: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: '2px 8px',
    borderRadius: '4px',
    border: '1px solid #d1d5db',
  },
  correctBadge: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#16a34a',
    backgroundColor: '#dcfce7',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  optionText: {
    fontSize: '16px',
    lineHeight: '1.5',
    color: '#374151',
    marginBottom: '8px',
  },
  optionMeta: {
    fontSize: '12px',
    color: '#6b7280',
    fontStyle: 'italic',
    backgroundColor: '#f8fafc',
    padding: '6px 8px',
    borderRadius: '4px',
    marginTop: '8px',
    border: '1px solid #e2e8f0',
  },
  summarySection: {
    padding: '20px',
    backgroundColor: '#f0fdf4',
    border: '2px solid #22c55e',
    borderRadius: '12px',
  },
  correctAnswerSummary: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#166534',
  },
  rawDataSection: {
    marginTop: '20px',
    padding: '16px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
  },
  rawDataToggle: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#475569',
    cursor: 'pointer',
    padding: '8px 0',
  },
  rawDataContent: {
    fontSize: '12px',
    color: '#1e293b',
    backgroundColor: '#ffffff',
    padding: '16px',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    overflow: 'auto',
    maxHeight: '400px',
    marginTop: '12px',
  },
  // Summary header styles
  summaryHeader: {
    padding: '20px',
    backgroundColor: '#f0f9ff',
    border: '2px solid #0ea5e9',
    borderRadius: '12px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  summaryTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#0c4a6e',
    margin: '0 0 8px 0',
  },
  summarySubtitle: {
    fontSize: '16px',
    color: '#0369a1',
    margin: '0',
  },
  // Bulk display styles
  bulkContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  bulkQuestionCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  },
  bulkQuestionHeader: {
    backgroundColor: '#f8fafc',
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
  },
  bulkQuestionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 12px 0',
  },
  bulkQuestionMeta: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  metaBadge: {
    fontSize: '12px',
    fontWeight: '500',
    padding: '4px 8px',
    backgroundColor: '#e2e8f0',
    color: '#475569',
    borderRadius: '4px',
    border: '1px solid #cbd5e1',
  },
  bulkQuestionContent: {
    padding: '20px',
  },
  bulkQuestionText: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#1f2937',
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
  },
  bulkImageContainer: {
    marginBottom: '16px',
    textAlign: 'center',
  },
  bulkQuestionImage: {
    maxWidth: '100%',
    maxHeight: '300px',
    borderRadius: '6px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  bulkOptionsContainer: {
    marginBottom: '16px',
  },
  bulkOptionsTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 12px 0',
  },
  bulkOptionCard: {
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    backgroundColor: '#fafafa',
    marginBottom: '8px',
  },
  bulkCorrectOption: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  bulkOptionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  bulkOptionValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
  },
  bulkOptionId: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: '2px 6px',
    borderRadius: '3px',
    border: '1px solid #d1d5db',
  },
  bulkCorrectBadge: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#16a34a',
    backgroundColor: '#dcfce7',
    padding: '2px 6px',
    borderRadius: '3px',
  },
  bulkOptionText: {
    fontSize: '14px',
    lineHeight: '1.4',
    color: '#374151',
  },
  bulkCorrectSummary: {
    fontSize: '14px',
    color: '#166534',
    backgroundColor: '#dcfce7',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #22c55e',
  },
};
