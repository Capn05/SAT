"use client"

import { useState } from 'react';
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
          content: `Your name is Ollie. You are a helpful SAT tutoring assistant. Your answers should be crafted to be understood by a 15 year old kid. Format your responses with clear structure:
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
        model: 'gpt-4-turbo-preview',
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

  const handleClearInput = () => {
    setUserQuestion('');
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.header}>
        <h3>Ollie: Your AI Tutor</h3>
      </div>
      <div style={styles.chatContainer}>
        <div style={styles.responseContainer} dangerouslySetInnerHTML={{ __html: renderResponse(response) }} />
        {loading && <div style={styles.loadingIndicator}>Loading...</div>}
      </div>
      <form onSubmit={(e) => handleUserQuestionSubmit(e)} style={styles.inputForm}>
        <MessageCircle style={styles.messageIcon} />
        <input
          type="text"
          placeholder="Ask me anything about this question..."
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
      <div style={styles.suggestions}>
        <button onClick={() => handleQuestionPreset("Explain the answer")} style={styles.suggestionButton}>
          Explain
        </button>
        <button onClick={() => handleQuestionPreset("Tell me why my answer is incorrect without revealing the correct answer")} style={styles.suggestionButton}>
          Why is my answer incorrect
        </button>
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
    marginBottom: '120px',
  },

    responseContainer: {
      fontSize: '14px',
      backgroundColor: '#fff',
      padding: '24px',  // Increased padding
      borderRadius: '8px',
      marginBottom: '12px',
      lineHeight: '1.8',  // Increased line height
      '& h1, & h2, & h3, & h4': {
        marginTop: '24px',    // Increased margin
        marginBottom: '16px', // Increased margin
        fontWeight: '600',
        color: '#111827',
      },
      '& h1': { fontSize: '1.8em' },
      '& h2': { 
        fontSize: '1.5em',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '8px'
      },
      '& h3': { fontSize: '1.3em' },
      '& p': {
        marginBottom: '16px',  // Increased margin
        color: '#374151',
      },
      '& ul, & ol': {
        marginTop: '12px',     // Added top margin
        marginBottom: '16px',  // Increased margin
        paddingLeft: '24px',   // Increased padding
      },
      '& li': {
        marginBottom: '12px',  // Increased margin
        paddingLeft: '4px',    // Added padding
      },
      '& li:last-child': {
        marginBottom: '0',     // Remove margin from last list item
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
        paddingLeft: '16px',   // Increased padding
        marginLeft: '0',
        marginTop: '16px',     // Added top margin
        marginBottom: '16px',  // Increased margin
        color: '#6b7280',
        fontStyle: 'italic',
        backgroundColor: '#f9fafb',
        padding: '12px 16px',  // Added padding
        borderRadius: '0 4px 4px 0',
      },
      '& .explanation-section': {
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
      },
      '& .option-analysis': {
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
        marginTop: '16px',     // Added top margin
        marginBottom: '16px',  // Increased margin
      },
      '& th, & td': {
        border: '1px solid #e5e7eb',
        padding: '12px',       // Increased padding
        textAlign: 'left',
      },
      '& th': {
        backgroundColor: '#f3f4f6',
        fontWeight: '600',
      },
      '& hr': {
        margin: '24px 0',      // Increased margin
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
  inputForm: {
    position: 'fixed',
    bottom: 0,
    right: 0,
    width: '40%',
    padding: '12px',
    borderTop: '1px solid #ddd',
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    zIndex: 11,
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
    border: '1px solid #ddd',
    marginRight: '8px',
    fontSize: '14px',
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
  suggestions: {
    position: 'fixed',
    bottom: '60px', // Changed from 120px to 60px
    right: 0,
    width: '40%',
    padding: '8px 16px',
    borderTop: '1px solid #ddd',
    backgroundColor: '#fff',
    zIndex: 11,
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