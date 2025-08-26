'use client';
import { useEffect, useState, useRef } from 'react';
import { MessageCircle, Send, X, Square } from 'lucide-react';
import MarkdownIt from 'markdown-it';
import markdownItKatex from 'markdown-it-katex';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { useChat } from '../hooks/useChat';

export default function AIChat({ question, selectedAnswer, options, imageURL }) {
  const [userQuestion, setUserQuestion] = useState('');
  const messagesEndRef = useRef(null);

  // Question context for the API
  const questionContext = {
    questionText: question,
    selectedAnswer,
    options,
    imageURL
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
  }, [question, clear]);

  // Set up the Markdown renderer with KaTeX support
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
    listIndent: 2
  }).use(markdownItKatex);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const messagesContainer = messagesEndRef.current.parentElement;
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
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
      <div 
        style={styles.container}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <h3 style={styles.title}>Brill: Your Personalized AI Tutor</h3>
        
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
        
        {/* Input container */}
        <div style={styles.inputContainer}>
          <form onSubmit={handleUserSubmit} style={styles.inputForm}>
            <MessageCircle style={styles.messageIcon} />
            <input
              type="text"
              placeholder="Ask me anything..."
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
          
          {/* Suggestion buttons */}
          <div style={styles.suggestions}>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleQuestionPreset("How do I get a perfect score on the PSAT?");
              }} 
              style={styles.suggestionButton}
              disabled={isLoading}
            >
              How to get a 1520?
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleQuestionPreset("What should I do today to improve my score?");
              }} 
              style={styles.suggestionButton}
              disabled={isLoading}
            >
              What should I do today?
            </button>

          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
    backgroundColor: 'white',
    transition: 'transform 0.2s ease',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '600px',
    fontFamily: '"Roboto", sans-serif',
  },
  title: {
    fontSize: '16px',
    fontWeight: 500,
    marginBottom: '16px',
    textAlign: 'center',
  },
  chatContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minHeight: '300px',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  userMessage: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    backgroundColor: '#10b981',
    color: 'white',
    padding: '12px 16px',
    borderRadius: '18px 18px 4px 18px',
    wordWrap: 'break-word',
    margin: '0 8px',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
    backgroundColor: '#f3f4f6',
    color: '#111827',
    padding: '12px 16px',
    borderRadius: '18px 18px 18px 4px',
    wordWrap: 'break-word',
    margin: '0 8px',
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
    margin: '0 8px',
  },
  inputContainer: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 0 8px 0 rgba(0, 0, 0, 0.1)',
  },
  inputForm: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px',
    borderRadius: '12px',
    marginBottom: '8px',
  },
  suggestions: {
    display: 'flex',
    flexWrap: 'wrap',
    padding: '8px 0',
    marginTop: '4px',
    gap: '8px',
  },
  suggestionButton: {
    padding: '8px 12px',
    backgroundColor: '#e6f0e6',
    color: '#333',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    opacity: 1,
    transition: 'background-color 0.2s ease',
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
  formattedContent: {
    // Placeholder for any specific formatted content styles
  },
};
