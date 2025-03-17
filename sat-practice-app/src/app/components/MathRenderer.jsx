'use client'

import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * A component that renders LaTeX mathematical expressions using KaTeX directly
 */
const MathRenderer = ({ math, block = false, options = {}, className = '' }) => {
  const elementRef = useRef(null);
  
  useEffect(() => {
    if (elementRef.current && math) {
      try {
        const defaultOptions = {
          throwOnError: false,
          errorColor: '#cc0000',
          displayMode: block,
          ...options
        };
        
        katex.render(math.trim(), elementRef.current, defaultOptions);
      } catch (error) {
        console.error('Error rendering math:', error);
        elementRef.current.textContent = `Math rendering error: ${math}`;
        elementRef.current.style.color = '#cc0000';
      }
    }
  }, [math, block, options]);
  
  return (
    <span 
      ref={elementRef} 
      className={`math-renderer ${block ? 'math-block' : 'math-inline'} ${className}`}
    ></span>
  );
};

/**
 * Enhanced processMathInText function to handle diagrams and math expressions
 */
export const processMathInText = (content) => {
  if (typeof content !== 'string') return content;

  // Extract any figure/diagram references
  const diagramRegex = /\[FIGURE:([^\]]+)\]/g;
  const diagrams = [];
  let diagramMatch;
  let diagramContent = content;
  
  while ((diagramMatch = diagramRegex.exec(content)) !== null) {
    const diagramSrc = diagramMatch[1];
    diagrams.push(diagramSrc);
    // Replace with placeholder
    diagramContent = diagramContent.replace(
      diagramMatch[0], 
      `[DIAGRAM_PLACEHOLDER_${diagrams.length - 1}]`
    );
  }

  // Process math expressions
  const blockMathRegex = /\$\$(.*?)\$\$/gs; // Note the 's' flag for multiline support
  const inlineMathRegex = /\$(.*?)\$/g;
  
  // First handle block math
  const blockParts = diagramContent.split(blockMathRegex);
  const result = [];
  
  let i = 0;
  while (i < blockParts.length) {
    // Add text content (potentially with inline math)
    if (blockParts[i]) {
      // Process inline math
      const inlineParts = blockParts[i].split(inlineMathRegex);
      let j = 0;
      while (j < inlineParts.length) {
        // If this part contains a diagram placeholder, insert the diagram
        const text = inlineParts[j];
        if (text) {
          // Check for diagram placeholders
          const diagramPlaceholderRegex = /\[DIAGRAM_PLACEHOLDER_(\d+)\]/;
          const parts = text.split(diagramPlaceholderRegex);
          
          if (parts.length > 1) {
            // We found a diagram placeholder
            for (let k = 0; k < parts.length; k++) {
              if (k % 2 === 0) {
                // Regular text
                if (parts[k]) {
                  result.push(<span key={`text-${i}-${j}-${k}`}>{parts[k]}</span>);
                }
              } else {
                // Diagram placeholder index
                const diagramIndex = parseInt(parts[k], 10);
                if (!isNaN(diagramIndex) && diagramIndex < diagrams.length) {
                  result.push(
                    <div key={`diagram-${diagramIndex}`} className="math-diagram">
                      <img src={diagrams[diagramIndex]} alt="Math diagram" />
                    </div>
                  );
                }
              }
            }
          } else {
            // Regular text without diagrams
            result.push(<span key={`text-${i}-${j}`}>{text}</span>);
          }
        }
        
        // Add inline math if there's a next part
        if (j + 1 < inlineParts.length) {
          const mathContent = inlineParts[j + 1];
          result.push(
            <span className="math-container" key={`inline-math-${i}-${j}`}>
              <MathRenderer 
                math={mathContent.trim()}
              />
            </span>
          );
          j += 2; // Skip the math content
        } else {
          j++;
        }
      }
    }
    
    // Add block math if there's a next part
    if (i + 1 < blockParts.length) {
      const mathContent = blockParts[i + 1];
      result.push(
        <div className="math-container" key={`block-math-${i}`}>
          <MathRenderer 
            math={mathContent.trim()}
            block={true}
          />
        </div>
      );
      i += 2; // Skip the math content
    } else {
      i++;
    }
  }
  
  return result;
};

// Special character escape for safe LaTeX rendering
export const escapeLaTeX = (text) => {
  if (typeof text !== 'string') return '';
  
  // Characters that need to be escaped in LaTeX
  const specialChars = {
    '&': '\\&',
    '%': '\\%',
    '$': '\\$',
    '#': '\\#',
    '_': '\\_',
    '{': '\\{',
    '}': '\\}',
    '~': '\\textasciitilde{}',
    '^': '\\textasciicircum{}',
    '\\': '\\textbackslash{}',
  };
  
  return text.replace(/[&%$#_{}~^\\]/g, (match) => specialChars[match]);
};

export default MathRenderer; 