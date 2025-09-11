'use client';
import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import MarkdownIt from 'markdown-it';
import markdownItKatex from 'markdown-it-katex';
import { useChat } from '../hooks/useChat';

export default function ReviewAIChat({ question, selectedAnswer, options, imageURL }) {
  const [userQuestion, setUserQuestion] = useState('');

  // Question context for the API
  const questionContext = {
    questionText: question,
    selectedAnswer,
    options,
    imageURL
  };

  const { 
    messages, 
    append,
    isLoading,
    clear 
  } = useChat({
    api: '/api/chat',
    questionContext
  });

  // Clear conversation when question changes
  useEffect(() => {
    clear();
    setUserQuestion('');
  }, [question, clear]);

  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
  }).use(markdownItKatex);

  const handleQuestionPreset = (presetQuestion) => {
    if (isLoading) return;
    setUserQuestion(presetQuestion);
    append({ content: presetQuestion });
  };

  const handleUserQuestionSubmit = (event) => {
    if (event) event.preventDefault();
    if (!userQuestion.trim() || isLoading) return;
    
    append({ content: userQuestion });
    setUserQuestion('');
  };

  const renderMathInline = (mathString) => {
    try {
      return katex.renderToString(mathString, {
        throwOnError: false,
        displayMode: false,
      });
    } catch (error) {
      console.error('Error rendering inline math:', error);
      return mathString;
    }
  };

  const renderMathBlock = (mathString) => {
    try {
      return katex.renderToString(mathString, {
        throwOnError: false,
        displayMode: true,
      });
    } catch (error) {
      console.error('Error rendering block math:', error);
      return mathString;
    }
  };

  const renderResponse = (responseText) => {
    if (!responseText) return '';
    
    // Process math expressions first
    const inlineMathRegex = /\$([^$]+)\$/g;
    const blockMathRegex = /\$\$([^$]+)\$\$/g;

    let formattedText = responseText.replace(blockMathRegex, (match, p1) => {
      return renderMathBlock(p1);
    });

    formattedText = formattedText.replace(inlineMathRegex, (match, p1) => {
      return renderMathInline(p1);
    });

    return md.render(formattedText);
  };

  // Get the latest assistant response for display
  const latestResponse = messages.filter(m => m.role === 'assistant').pop()?.content || '';

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Brill: Your Personalized AI Tutor</h3>
      <form onSubmit={handleUserQuestionSubmit} style={styles.inputContainer}>
        <MessageCircle style={styles.icon} />
        <input
          type="text"
          placeholder="Ask me anything about this question!"
          style={styles.input}
          value={userQuestion}
          onChange={(e) => setUserQuestion(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" style={styles.submitButton} disabled={isLoading || !userQuestion.trim()}>
          {isLoading ? 'Asking...' : 'Ask'}
        </button>
      </form>
      <div style={{ fontSize: '14px', paddingTop: '10px' }}>Suggestions:</div>
      <div style={styles.buttonContainer}>
        <button 
          onClick={() => handleQuestionPreset("Explain the answer")} 
          style={styles.secondaryButton}
          disabled={isLoading}
        >
          Explain
        </button>

        <button 
          onClick={() => handleQuestionPreset("Tell me why my answer is incorrect without revealing the correct answer")} 
          style={styles.secondaryButton}
          disabled={isLoading}
        >
          Why is my answer incorrect
        </button>
      </div>
      <div style={styles.paddingBox}>
        <div style={styles.responseBox}>
          {isLoading && !latestResponse && (
            <div style={styles.loadingIndicator}>Brill is thinking...</div>
          )}
          <div style={styles.innermostBox} dangerouslySetInnerHTML={{ __html: renderResponse(latestResponse) }} />
        </div>
      </div>
    </div>
  );
}

const styles = {
  buttonContainer: { 
    paddingTop: '10px'
  },
  container: {
    padding: '20px',
    borderRadius: '20px',
    margin: '10px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
  },
  paddingBox: {
    backgroundColor: '#f3f3f3',
    marginTop: '8px',
    padding: '30px',
    borderRadius: '8px',
  },
  title: {
    fontSize: '16px',
    fontWeight: 500,
    marginBottom: '16px',
  },
  inputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
  },
  icon: {
    width: '20px',
    height: '20px',
    color: '#65a30d',
  },
  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '14px',
  },
  submitButton: {
    padding: '8px 16px',
    backgroundColor: '#65a30d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  responseBox: {
    padding: '10px',
    borderRadius: '8px',
  },
  secondaryButton: {
    padding: '8px 16px',
    backgroundColor: '#e6f0e6',
    color: '#333',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginRight: '10px',
    transition: 'opacity 0.2s ease',
  },
  loadingIndicator: {
    fontSize: '14px',
    color: '#aaa',
    padding: '12px',
    textAlign: 'center',
    fontStyle: 'italic',
  },
}; 