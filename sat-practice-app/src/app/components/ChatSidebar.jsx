"use client"

import { useState, useEffect } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import OpenAI from 'openai';
import MarkdownIt from 'markdown-it';
import markdownItKatex from 'markdown-it-katex';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default function ChatSidebar({ questionText, selectedAnswer, options, imageURL }) {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');

  // Clear response when question changes
  useEffect(() => {
    setResponse('');
    setUserQuestion('');
  }, [questionText]);

  // Initialize the OpenAI instance
  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPEN_AI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  // Set up the Markdown renderer with KaTeX support
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,  // Recognize line breaks
    listIndent: 2  // Proper indentation for lists
  }).use(markdownItKatex);

  const handleQuestionPreset = (presetQuestion) => {
    setUserQuestion(presetQuestion);
    handleUserQuestionSubmit(null, presetQuestion);
  };

  const handleUserQuestionSubmit = async (event, presetQuestion) => {
    if (event) event.preventDefault();
    const questionToUse = presetQuestion || userQuestion;
    if (!questionToUse) return;
    setLoading(true);
    setResponse('');

    try {
      // Construct messages for the OpenAI chat call
      const messages = [
        {
          role: 'system',
          content: `Your name is Brill. You are a helpful SAT tutoring assistant. Your answers should be crafted to be understood by a 15 year old kid. Format your responses with clear structure:
          - Use headers (##) for main sections
          - Use bullet points for lists
          - **Bold** important concepts
          - Use line breaks for readability
          - Include examples in \`code\` blocks
          - Use tables when comparing concepts
          The question: ${questionText}. The answer the user selected: ${selectedAnswer}. All answer choices: ${JSON.stringify(options)}. Use markdown for all output. When presenting mathematical equations or formulas, use LaTeX syntax enclosed in double dollar signs for block math (e.g., $$x^2 + y^2 = z^2$$) and single dollar signs for inline math (e.g., $E=mc^2$).`,
        },
        { role: 'user', content: questionToUse },
      ];

      if (imageURL) {
        messages.push({
          role: 'user',
          content: `Additionally, here is an image: ${imageURL}`,
        });
      }

      // Create a streaming chat completion using the OpenAI instance
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        stream: true,
      });

      // Stream the response piece by piece
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          setResponse((prev) => prev + content);
        }
      }
    } catch (error) {
      if (error.status === 429) {
        setResponse('You are sending requests too quickly. Please wait a moment and try again.');
      } else {
        console.error('Error fetching AI response:', error);
        setResponse('Error fetching response from AI.');
      }
    } finally {
      setLoading(false);
    }
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
    // Fix common issues with lists not having proper spacing
    formattedText = formattedText
      // Ensure there's a blank line before lists
      .replace(/([^\n])\n([\s]*[-*+])/g, '$1\n\n$2')
      // Ensure proper indentation for nested lists
      .replace(/\n([\s]*)([-*+])([\s]+)/g, '\n$1$2 ');
    
    // Render markdown with the enhanced formatting
    const renderedHtml = md.render(formattedText);
    
    return renderedHtml;
  };

  const handleClearInput = () => {
    setUserQuestion('');
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.header}>
        <h3>Review your Answers with Brill</h3>
      </div>
      <div style={styles.chatContainer}>
        <div style={styles.responseContainer} dangerouslySetInnerHTML={{ __html: renderResponse(response) }} />
        {loading && <div style={styles.loadingIndicator}>Loading...</div>}
      </div>
      
      {/* Combined input and suggestions container */}
      <div style={styles.inputContainer}>
        {/* Input form - now placed first */}
        <form onSubmit={(e) => handleUserQuestionSubmit(e)} style={styles.inputForm}>
          <MessageCircle style={styles.messageIcon} />
          <input
            type="text"
            placeholder="Ask me anything about the question selected..."
            style={styles.inputField}
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
          />
          {userQuestion && (
            <button 
              type="button" 
              onClick={handleClearInput} 
              style={styles.clearButton}
            >
              <X size={16} />
            </button>
          )}
          <button type="submit" style={styles.sendButton}>
            <Send size={20} />
          </button>
        </form>
        
        {/* Suggestions - now placed below the input */}
        <div style={styles.suggestions}>
        <button onClick={() => handleQuestionPreset("Give me a hint for the question without revealing the answer")} style={styles.suggestionButton}>
            Hint
          </button>
          <button onClick={() => handleQuestionPreset("Explain the answer")} style={styles.suggestionButton}>
            Explain
          </button>
          <button onClick={() => handleQuestionPreset("Tell me why my answer is incorrect without revealing the correct answer")} style={styles.suggestionButton}>
            Why is my answer incorrect
          </button>

        </div>
      </div>
    </aside>
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
    padding: '16px',
    overflowY: 'auto',
    marginBottom: '0px',
    backgroundColor: 'white'
  },
  responseContainer: {
    fontSize: '14px',
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '8px',
    marginBottom: '120px',
    lineHeight: '1.8',
    fontFamily: '"Roboto", sans-serif',
    '& h1, & h2, & h3, & h4': {
      marginTop: '24px',
      marginBottom: '16px',
      fontWeight: '600',
      color: '#111827',
      fontFamily: '"Roboto", sans-serif',
    },
    '& h1': { fontSize: '1.8em' },
    '& h2': { 
      fontSize: '1.5em',
      borderBottom: '1px solid #e5e7eb',
      paddingBottom: '8px'
    },
    '& h3': { fontSize: '1.3em' },
    '& p': {
      marginBottom: '16px',
      color: '#374151',
    },
    '& ul, & ol': {
      marginTop: '12px',
      marginBottom: '16px',
      paddingLeft: '24px',
    },
    '& li': {
      marginBottom: '12px',
      paddingLeft: '4px',
      position: 'relative',
      listStylePosition: 'outside',
    },
    '& li:lastChild': {
      marginBottom: '0',
    },
    '& li > ul, & li > ol': {
      marginTop: '8px',
      marginBottom: '0',
    },
    '& strong, & b': {
      color: '#111827',
      fontWeight: '600',
      backgroundColor: '#f3f4f6',
      padding: '0 4px',
      borderRadius: '4px',
    },
    '& code': {
      backgroundColor: '#f3f4f6',
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '0.9em',
      color: '#ef4444',
    },
    '& blockquote': {
      borderLeft: '4px solid #e5e7eb',
      paddingLeft: '16px',
      marginLeft: '0',
      marginTop: '16px',
      marginBottom: '16px',
      color: '#6b7280',
      fontStyle: 'italic',
      backgroundColor: '#f9fafb',
      padding: '12px 16px',
      borderRadius: '0 4px 4px 0',
    },
    '& .explanationSection': {
      marginTop: '24px',
      padding: '16px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
    },
    '& .optionAnalysis': {
      marginTop: '12px',
      paddingLeft: '16px',
      borderLeft: '3px solid #10b981',
    },
    '& .conclusion': {
      marginTop: '24px',
      paddingTop: '16px',
      borderTop: '1px solid #e5e7eb',
      fontWeight: '500',
    },
    '& table': {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '16px',
      marginBottom: '16px',
    },
    '& th, & td': {
      border: '1px solid #e5e7eb',
      padding: '12px',
      textAlign: 'left',
    },
    '& th': {
      backgroundColor: '#f3f4f6',
      fontWeight: '600',
    },
    '& hr': {
      margin: '24px 0',
      border: 'none',
      borderTop: '1px solid #e5e7eb',
    },
  },
  loadingIndicator: {
    fontSize: '14px',
    color: '#aaa',
    padding: '12px',
    textAlign: 'center',
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
    // border: '1px solid #ddd',
    marginBottom: '8px', // Added margin to create space between input and suggestions
  },
  // Updated styles for suggestions
  suggestions: {
    display: 'flex',
    padding: '8px 0',
    marginTop: '4px', // Added margin to create space between input and suggestions
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
  },
  messageIcon: {
    width: '20px',
    height: '20px',
    color: '#65a30d',
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
    outline: 'none', // Removes the blue highlight on focus
  },
  sendButton: {
    padding: '8px 12px',
    backgroundColor: '#65a30d',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
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
    ':hover': {
      backgroundColor: '#f0f0f0',
    }
  },
};