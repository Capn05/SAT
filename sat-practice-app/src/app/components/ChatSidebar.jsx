"use client"

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Square } from 'lucide-react';
import MarkdownIt from 'markdown-it';
import markdownItKatex from 'markdown-it-katex';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { useChat } from '../hooks/useChat';

export default function ChatSidebar({ questionText, selectedAnswer, options, imageURL, questionId }) {
  const [userQuestion, setUserQuestion] = useState('');
  const messagesEndRef = useRef(null);

  // Question context for the API
  const questionContext = {
    questionText,
    selectedAnswer,
    options,
    imageURL,
    questionId
  };

  const { 
    messages, 
    input, 
    setInput, 
    handleSubmit, 
    isLoading, 
    stop, 
    append,
    clear 
  } = useChat({
    api: '/api/chat',
    questionContext,
    onFinish: () => {
      scrollToBottom();
    }
  });

  // Clear conversation when question changes
  useEffect(() => {
    clear();
    setUserQuestion('');
  }, [questionText, questionId, clear]);

  // Set up the Markdown renderer with KaTeX support
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
    listIndent: 2
  }).use(markdownItKatex);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleQuestionPreset = (presetQuestion) => {
    if (isLoading) return;
    append({ content: presetQuestion });
  };

  const handleUserSubmit = (e) => {
    e.preventDefault();
    if (!userQuestion.trim() || isLoading) return;
    
    append({ content: userQuestion });
    setUserQuestion('');
  };

  const handleClearInput = () => {
    setUserQuestion('');
  };

  // Helper functions for rendering math using KaTeX
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

  // Render the output response applying math conversions and Markdown formatting
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
    
    // Ensure proper list formatting in markdown
    formattedText = formattedText
      .replace(/([^\n])\n([\s]*[-*+])/g, '$1\n\n$2')
      .replace(/\n([\s]*)([-*+])([\s]+)/g, '\n$1$2 ');
    
    // Render markdown with the enhanced formatting
    const renderedHtml = md.render(formattedText);
    
    return renderedHtml;
  };

  return (
    <>
      <style jsx global>{`
        .message-content h1,
        .message-content h2,
        .message-content h3,
        .message-content h4,
        .message-content h5,
        .message-content h6 {
          margin-top: 1.2em;
          margin-bottom: 0.6em;
          font-weight: 600;
          line-height: 1.3;
        }
        
        .message-content h1:first-child,
        .message-content h2:first-child,
        .message-content h3:first-child,
        .message-content h4:first-child,
        .message-content h5:first-child,
        .message-content h6:first-child {
          margin-top: 0;
        }
        
        .message-content p {
          margin-bottom: 0.8em;
          line-height: 1.5;
        }
        
        .message-content ul,
        .message-content ol {
          margin: 0.8em 0;
          padding-left: 1.2em;
        }
        
        .message-content li {
          margin-bottom: 0.4em;
          line-height: 1.4;
        }
        
        .message-content strong {
          font-weight: 600;
        }
        
        .message-content table {
          margin: 1em 0;
          border-collapse: collapse;
          width: 100%;
        }
        
        .message-content th,
        .message-content td {
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          text-align: left;
        }
        
        .message-content th {
          background-color: #f9fafb;
          font-weight: 600;
        }
      `}</style>
      <aside style={styles.sidebar}>
        <div style={styles.header}>
          <h3>Chat with Brill</h3>
        </div>
        
        <div style={styles.chatContainer}>
          <div style={styles.messagesContainer}>
            {messages.map((message) => (
              <div 
                key={message.id} 
                style={message.role === 'user' ? styles.userMessage : styles.assistantMessage}
              >
                <div style={styles.messageHeader}>
                  <strong>{message.role === 'user' ? 'You' : 'Brill'}</strong>
                  <span style={styles.timestamp}>
                    {message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : ''}
                  </span>
                </div>
                <div style={{...styles.messageContent, ...styles.formattedContent}} className="message-content">
                  {message.role === 'assistant' ? (
                    <div dangerouslySetInnerHTML={{ __html: renderResponse(message.content) }} />
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && <div style={styles.loadingIndicator}>Brill is typing...</div>}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Combined input and suggestions container */}
        <div style={styles.inputContainer}>
          {/* Input form */}
          <form onSubmit={handleUserSubmit} style={styles.inputForm}>
            <MessageCircle style={styles.messageIcon} />
            <input
              type="text"
              placeholder="Ask me anything about the question..."
              style={styles.inputField}
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
            />
            {userQuestion && !isLoading && (
              <button 
                type="button" 
                onClick={handleClearInput} 
                style={styles.clearButton}
              >
                <X size={16} />
              </button>
            )}
            {isLoading ? (
              <button 
                type="button" 
                onClick={stop} 
                style={styles.stopButton}
              >
                <Square size={16} />
              </button>
            ) : (
              <button type="submit" style={styles.sendButton}>
                <Send size={20} />
              </button>
            )}
          </form>
          
          {/* Suggestions - now placed below the input */}
          <div style={styles.suggestions}>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleQuestionPreset("Give me a hint for the question without revealing the answer");
              }} 
              style={styles.suggestionButton}
              disabled={isLoading}
            >
              Hint
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleQuestionPreset("Explain the answer");
              }} 
              style={styles.suggestionButton}
              disabled={isLoading}
            >
              Explain
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleQuestionPreset("Tell me why my answer is incorrect without revealing the correct answer");
              }} 
              style={styles.suggestionButton}
              disabled={isLoading}
            >
              Why is my answer incorrect
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

const styles = {
  sidebar: {
    position: 'fixed',
    top: 0,
    right: 0,
    height: '100vh',
    width: '40%',
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '1px solid #ddd',
    backgroundColor: '#f7f7f7',
    zIndex: 10,
    fontFamily: '"Roboto", sans-serif',
  },
  header: {
    padding: '16px',
    borderBottom: '1px solid #ddd',
    backgroundColor: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  chatContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    paddingBottom: '150px', // Extra space so content isn't covered by input box
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    backgroundColor: 'white',
  },
  userMessage: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    backgroundColor: '#10b981',
    color: 'white',
    padding: '16px 20px',
    borderRadius: '18px 18px 4px 18px',
    wordWrap: 'break-word',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
    backgroundColor: '#f3f4f6',
    color: '#111827',
    padding: '16px 24px',
    borderRadius: '18px 18px 18px 4px',
    wordWrap: 'break-word',
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
    fontSize: '12px',
    opacity: 0.7,
  },
  messageContent: {
    fontSize: '14px',
    lineHeight: '1.5',
  },
  timestamp: {
    fontSize: '10px',
    opacity: 0.5,
  },
  loadingIndicator: {
    fontSize: '14px',
    color: '#aaa',
    padding: '12px',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Container that holds both input form and suggestions
  inputContainer: {
    position: 'fixed',
    bottom: '1.5%',
    right: '1.3%',
    width: '37%',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    zIndex: 11,
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '12px',
    boxShadow: '0 0 8px 0 rgba(0, 0, 0, 0.1)',
  },
  // Updated styles for the input form
  inputForm: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px',
    borderRadius: '12px',
    marginBottom: '8px',
  },
  // Updated styles for suggestions
  suggestions: {
    display: 'flex',
    padding: '8px 0',
    marginTop: '4px',
  },
  suggestionButton: {
    padding: '8px 12px',
    backgroundColor: '#e6f0e6',
    color: '#333',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginRight: '8px',
    opacity: 1,
  },
  messageIcon: {
    width: '20px',
    height: '20px',
    color: '#10b981',
    marginRight: '8px',
  },
  inputField: {
    flex: 1,
    padding: '8px',
    borderRadius: '4px',
    border: '0px solid #ddd',
    marginRight: '8px',
    fontSize: '14px',
    backgroundColor: 'white',
    outline: 'none',
  },
  sendButton: {
    padding: '8px 12px',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
  },
  stopButton: {
    padding: '8px 12px',
    backgroundColor: '#ef4444',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    color: '#666',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    marginRight: '4px',
  },
  // New styles for formatted content
  formattedContent: {
    // Add any specific styles for formatted content if needed,
    // but the main messageContent styles already handle line height and paragraph spacing.
    // This is primarily for headers and lists.
  },
};