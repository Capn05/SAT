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
  
  // New state for editing functionality
  const [editModal, setEditModal] = useState(false);
  const [editType, setEditType] = useState(''); // 'question' or 'option'
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  
  // New state for table switching
  const [useNewTables, setUseNewTables] = useState(false);

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
      const response = await fetch(`/api/dev-question-by-id?id=${encodeURIComponent(questionId.trim())}&use_new_tables=${useNewTables}`);
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
      
      params.append('use_new_tables', useNewTables);

      const response = await fetch(`/api/dev-questions-by-criteria?${params}`);
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

  // Edit functions
  const openQuestionEdit = (question) => {
    console.log('Opening question edit for:', question);
    setEditType('question');
    setEditData({
      id: question.id,
      question_text: question.text,
      difficulty: question.difficulty,
      image_url: question.imageUrl || ''
    });
    setEditModal(true);
  };

  const openOptionEdit = (option, questionId) => {
    console.log('Opening option edit for:', option, 'questionId:', questionId);
    setEditType('option');
    setEditData({
      id: option.id,
      questionId: questionId,
      label: option.text,
      is_correct: option.isCorrect
    });
    setEditModal(true);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    
    const requestData = {
      type: editType,
      id: editData.id,
      useNewTables: useNewTables,
      data: editType === 'question' ? {
        question_text: editData.question_text,
        difficulty: editData.difficulty,
        image_url: editData.image_url
      } : {
        label: editData.label,
        is_correct: editData.is_correct
      }
    };
    
    console.log('Sending update request:', requestData);
    
    try {
      const response = await fetch('/api/dev-update-question', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      // Update local state
      if (editType === 'question') {
        // Update single question if it exists
        if (question && question.id === editData.id) {
          setQuestion(prev => ({
            ...prev,
            text: editData.question_text,
            difficulty: editData.difficulty,
            imageUrl: editData.image_url
          }));
        }
        // Update bulk questions if they exist
        setQuestions(prev => prev.map(q => 
          q.id === editData.id 
            ? { ...q, text: editData.question_text, difficulty: editData.difficulty, imageUrl: editData.image_url }
            : q
        ));
      } else {
        // Update options in both single and bulk views
        const updateOptions = (q) => ({
          ...q,
          options: q.options.map(opt => 
            opt.id === editData.id 
              ? { ...opt, text: editData.label, isCorrect: editData.is_correct }
              : opt
          )
        });

        if (question) {
          setQuestion(updateOptions);
        }
        setQuestions(prev => prev.map(q => 
          q.id === editData.questionId ? updateOptions(q) : q
        ));
      }

      setEditModal(false);
      setEditData({});
      alert(`${editType === 'question' ? 'Question' : 'Option'} updated successfully!`);

    } catch (err) {
      console.error('Error saving edit:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditModal(false);
    setEditData({});
    setEditType('');
  };

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

      {/* Table Toggle Slider */}
      <div style={styles.tableToggleContainer}>
        <div style={styles.toggleSection}>
          <span style={styles.toggleLabel}>
            📊 Database Tables: 
          </span>
          <div style={styles.switchContainer}>
            <span style={{...styles.switchLabel, ...(useNewTables ? {} : styles.switchLabelActive)}}>
              questions/options
            </span>
            <label style={styles.switch}>
              <input
                type="checkbox"
                checked={useNewTables}
                onChange={(e) => setUseNewTables(e.target.checked)}
                style={styles.switchInput}
              />
              <span style={{
                ...styles.slider,
                backgroundColor: useNewTables ? '#3b82f6' : '#cbd5e1',
              }}>
                <span style={{
                  ...styles.sliderBall,
                  transform: useNewTables ? 'translateX(26px)' : 'translateX(0)',
                }}></span>
              </span>
            </label>
            <span style={{...styles.switchLabel, ...(useNewTables ? styles.switchLabelActive : {})}}>
              new_questions/new_options
            </span>
          </div>
        </div>
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
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>❓ Question</h2>
              <button
                style={styles.editButton}
                onClick={() => openQuestionEdit(question)}
                title="Edit Question"
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#dbeafe';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#eff6ff';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                ✏️ Edit
              </button>
            </div>
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
                    <div style={styles.optionHeaderRight}>
                      {option.isCorrect && (
                        <span style={styles.correctBadge}>✅ CORRECT</span>
                      )}
                      <button
                        style={styles.editOptionButton}
                        onClick={() => openOptionEdit(option, question.id)}
                        title="Edit Option"
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#f3f4f6';
                          e.target.style.color = '#374151';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#f9fafb';
                          e.target.style.color = '#6b7280';
                        }}
                      >
                        ✏️
                      </button>
                    </div>
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
                <div style={styles.bulkQuestionTitleSection}>
                  <h3 style={styles.bulkQuestionTitle}>
                    Question #{index + 1} (ID: {question.id})
                  </h3>
                  <button
                    style={styles.editButton}
                    onClick={() => openQuestionEdit(question)}
                    title="Edit Question"
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#dbeafe';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#eff6ff';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    ✏️ Edit
                  </button>
                </div>
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
                        <div style={styles.optionHeaderRight}>
                          {option.isCorrect && (
                            <span style={styles.bulkCorrectBadge}>✅ CORRECT</span>
                          )}
                          <button
                            style={styles.editOptionButton}
                            onClick={() => openOptionEdit(option, question.id)}
                            title="Edit Option"
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#f3f4f6';
                              e.target.style.color = '#374151';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = '#f9fafb';
                              e.target.style.color = '#6b7280';
                            }}
                          >
                            ✏️
                          </button>
                        </div>
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

      {/* Edit Modal */}
      {editModal && (
        <div 
          style={styles.modalOverlay}
          onClick={handleCancelEdit}
        >
          <div 
            style={styles.editModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.editModalHeader}>
              <h3 style={styles.editModalTitle}>
                {editType === 'question' ? '✏️ Edit Question' : '✏️ Edit Option'}
              </h3>
              <button 
                style={styles.modalCloseButton}
                onClick={handleCancelEdit}
              >
                ×
              </button>
            </div>
            
            <div style={styles.editModalBody}>
              {editType === 'question' ? (
                <>
                  <div style={styles.editFormGroup}>
                    <label style={styles.editLabel}>Question Text:</label>
                    <textarea
                      style={styles.editTextarea}
                      value={editData.question_text || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, question_text: e.target.value }))}
                      rows={6}
                      placeholder="Enter question text..."
                    />
                  </div>
                  <div style={styles.editFormGroup}>
                    <label style={styles.editLabel}>Difficulty:</label>
                    <select
                      style={styles.editSelect}
                      value={editData.difficulty || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, difficulty: e.target.value }))}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div style={styles.editFormGroup}>
                    <label style={styles.editLabel}>Image URL (optional):</label>
                    <input
                      style={styles.editInput}
                      type="text"
                      value={editData.image_url || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://example.com/image.png"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div style={styles.editFormGroup}>
                    <label style={styles.editLabel}>Option Text:</label>
                    <textarea
                      style={styles.editTextarea}
                      value={editData.label || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, label: e.target.value }))}
                      rows={4}
                      placeholder="Enter option text..."
                    />
                  </div>
                  <div style={styles.editFormGroup}>
                    <label style={styles.editCheckboxLabel}>
                      <input
                        type="checkbox"
                        checked={editData.is_correct || false}
                        onChange={(e) => setEditData(prev => ({ ...prev, is_correct: e.target.checked }))}
                        style={styles.editCheckbox}
                      />
                      This is the correct answer
                    </label>
                  </div>
                </>
              )}
            </div>

            <div style={styles.editModalFooter}>
              <button
                style={styles.editCancelButton}
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                style={styles.editSaveButton}
                onClick={handleSaveEdit}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
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
  // Edit functionality styles
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
    padding: '20px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
  },
  editButton: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#3b82f6',
    backgroundColor: '#eff6ff',
    border: '1px solid #3b82f6',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#dbeafe',
      transform: 'translateY(-1px)',
    },
  },
  editOptionButton: {
    padding: '4px 8px',
    fontSize: '12px',
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginLeft: '8px',
    '&:hover': {
      backgroundColor: '#f3f4f6',
      color: '#374151',
    },
  },
  optionHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  bulkQuestionTitleSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
  },
  editModalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'hidden',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    margin: 'auto',
  },
  editModalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editModalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0',
  },
  editModalBody: {
    padding: '24px',
    flex: 1,
    overflow: 'auto',
  },
  editModalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  editFormGroup: {
    marginBottom: '20px',
  },
  editLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px',
  },
  editInput: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    transition: 'border-color 0.2s ease',
    '&:focus': {
      outline: 'none',
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
    },
  },
  editTextarea: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    resize: 'vertical',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease',
    '&:focus': {
      outline: 'none',
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
    },
  },
  editSelect: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease',
    '&:focus': {
      outline: 'none',
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
    },
  },
  editCheckboxLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    color: '#374151',
    cursor: 'pointer',
  },
  editCheckbox: {
    marginRight: '8px',
    transform: 'scale(1.2)',
  },
  editSaveButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover:not(:disabled)': {
      backgroundColor: '#059669',
      transform: 'translateY(-1px)',
    },
    '&:disabled': {
      backgroundColor: '#9ca3af',
      cursor: 'not-allowed',
    },
  },
  editCancelButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    backgroundColor: '#f9fafb',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover:not(:disabled)': {
      backgroundColor: '#f3f4f6',
      borderColor: '#9ca3af',
    },
  },
  
  // Table Toggle Styles
  tableToggleContainer: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
  },
  toggleSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  toggleLabel: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#374151',
  },
  switchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  switchLabel: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '400',
    transition: 'color 0.2s ease',
  },
  switchLabelActive: {
    color: '#1f2937',
    fontWeight: '500',
  },
  switch: {
    position: 'relative',
    display: 'inline-block',
    width: '50px',
    height: '24px',
  },
  switchInput: {
    opacity: 0,
    width: 0,
    height: 0,
  },
  slider: {
    position: 'absolute',
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#cbd5e1',
    transition: 'background-color 0.3s ease',
    borderRadius: '24px',
  },
  sliderBall: {
    position: 'absolute',
    height: '18px',
    width: '18px',
    left: '3px',
    bottom: '3px',
    backgroundColor: 'white',
    transition: 'transform 0.3s ease',
    borderRadius: '50%',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
};
