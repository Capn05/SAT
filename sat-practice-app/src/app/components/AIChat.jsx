'use client';
import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import OpenAI from 'openai';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import MarkdownIt from 'markdown-it';
import markdownItKatex from 'markdown-it-katex';
import dotenv from 'dotenv';
import DesmosGraph from './DesmosGraph';
dotenv.config({ path: '.env.local' }); // Load environment variables

export default function AIChat({ question, selectedAnswer, options, imageURL }) {

  const [response, setResponse] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [graphExpressions, setGraphExpressions] = useState([]);
  console.log(process.env.NEXT_PUBLIC_OPEN_AI_API_KEY)
  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPEN_AI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
  }).use(markdownItKatex);
  const handleQuestionPreset = (presetQuestion) => {
    setUserQuestion(presetQuestion);
    handleUserQuestionSubmit(null, presetQuestion);
  }
  const handleUserQuestionSubmit = async (event, presetQuestion) => {
    if (event) event.preventDefault();
    const questionToUse = presetQuestion || userQuestion;
    if (!questionToUse) return;

    setLoading(true);
    setResponse('');
    setGraphExpressions([]);

    try {
      const messages = [
        {
          role: 'system',
          content: `Your name is Ollie, You are a helpful SAT tutoring assistant, your answers should be crafted to be understood by a 10 year old kid. The user may ask about the math question in front of them but they may ask you about other things as well. The question that the user may be referring to: ${question}. The answer choice that the user selected (undefined or null if the user has not answered yet): ${selectedAnswer}. All answer choices where 'label' are the options: ${JSON.stringify(
            options
          )}. 
          
          When you need to show a graph, use the following format:
          <graph>
          y=x^2
          y=2x+1
          </graph>
          
          Each line between <graph> tags will be interpreted as a separate equation to plot. Use LaTeX syntax for equations.
          
          Use markdown for all output. When presenting mathematical equations or formulas, use LaTeX syntax enclosed in double dollar signs for block math (e.g., $$x^2 + y^2 = z^2$$) and single dollar signs for inline math (e.g., $E=mc^2$).`,
        },
        { role: 'user', content: questionToUse },
      ];
  
      // Conditionally add the image message
      if (imageURL) {
        messages.push({
          role: 'user',
          content: [{
            type: 'image_url',
            image_url: {
              url: `${imageURL}`,
            },
          }],
        });
      }
  
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        stream: true,
      });
  
      let currentResponse = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          currentResponse += content;
          setResponse(currentResponse);
          
          // Check for graph tags and extract expressions
          const graphMatch = currentResponse.match(/<graph>([\s\S]*?)<\/graph>/);
          if (graphMatch) {
            const expressions = graphMatch[1]
              .trim()
              .split('\n')
              .map(expr => expr.trim())
              .filter(expr => expr.length > 0);
            setGraphExpressions(expressions);
          }
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

  const renderMath = (mathString) => {
    try {
      return katex.renderToString(mathString, {
        throwOnError: false,
        displayMode: false,
      });
    } catch (error) {
      console.error('Error rendering math:', error);
      return mathString;
    }
  };

  const renderBlockMath = (mathString) => {
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

  const renderResponse = (response) => {
    // Remove graph tags from the rendered output
    const cleanResponse = response.replace(/<graph>[\s\S]*?<\/graph>/g, '');
    
    // Matches inline math only if it is surrounded by word boundaries
    const inlineMathRegex = /(?<!\w)\$([^$]+)\$(?!\w)/g; // Matches inline math
    const blockMathRegex = /(?<!\w)\$\$([^$]+)\$\$(?!\w)/g; // Matches block math

    // Replace block math with rendered output first
    let formattedResponse = cleanResponse.replace(blockMathRegex, (match, p1) => {
      return renderBlockMath(p1);
    });

    // Replace inline math with rendered output
    formattedResponse = formattedResponse.replace(inlineMathRegex, (match, p1) => {
      return renderMath(p1);
    });

    // Render the remaining markdown content
    return md.render(formattedResponse);
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Ollie: Your Personalized AI Tutor</h3>
      <form onSubmit={(e) => handleUserQuestionSubmit(e)} style={styles.inputContainer}>
        <MessageCircle style={styles.icon} />
        <input
          type="text"
          placeholder="Ask me anything about this question!"
          style={styles.input}
          value={userQuestion}
          onChange={(e) => setUserQuestion(e.target.value)}
        />
        <button type="submit" style={styles.submitButton}>
          Ask
        </button>
      </form>
      <div style={{ fontSize: '14px', paddingTop: '10px' }}>Suggestions:</div>
      <div style={styles.buttonContainer}>
      <button onClick={() => handleQuestionPreset("Explain the answer")} style={styles.secondaryButton}>
    Explain
  </button>
  <button onClick={() => handleQuestionPreset("Give me a hint without revealing the correct answer")} style={styles.secondaryButton}>
    Hint
  </button>
  <button onClick={() => handleQuestionPreset("Create a very similar question for me to practice")} style={styles.secondaryButton}>
    Similar Question
  </button>
  <button onClick={() => handleQuestionPreset("Tell me why my answer is incorrect without revealing the correct answer")} style={styles.secondaryButton}>
    Why is my answer incorrect
  </button>
      </div>
    <div style={styles.paddingBox}>
      <div style={styles.responseBox}>
        <div style={styles.innermostBox} dangerouslySetInnerHTML={{ __html: renderResponse(response) }} />
        {graphExpressions.length > 0 && (
          <DesmosGraph expressions={graphExpressions} />
        )}
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
    marginRight:'10px'
  },
};
