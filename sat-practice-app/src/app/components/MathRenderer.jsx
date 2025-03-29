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
 * Process table formatting in content
 */
export const processTableFormat = (text) => {
  if (!text || text.includes('|---') || text.includes('| ---')) {
    return text;
  }
  
  const lines = text.split('\n');
  let tableStartIndex = -1;
  let tableEndIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|') && lines[i].split('|').length > 2) {
      if (tableStartIndex === -1) {
        tableStartIndex = i;
      }
      tableEndIndex = i;
    } else if (tableStartIndex !== -1 && tableEndIndex !== -1 && !lines[i].includes('|')) {
      break;
    }
  }
  
  if (tableStartIndex !== -1 && tableEndIndex !== -1 && tableEndIndex > tableStartIndex) {
    const headerRow = lines[tableStartIndex].trim();
    const columnCount = headerRow.split('|').filter(cell => cell.trim()).length;
    
    const separatorRow = '|' + Array(columnCount).fill(' --- ').join('|') + '|';
    
    lines.splice(tableStartIndex + 1, 0, separatorRow);
    
    return lines.join('\n');
  }
  
  return text;
};

/**
 * Enhanced processWithKaTeX for math expressions rendering
 */
export const processWithKaTeX = (content) => {
  if (!content) return '';
  
  // Replace escaped dollar signs with a placeholder BEFORE processing math
  const DOLLAR_PLACEHOLDER = '___DOLLAR_SIGN___';
  content = content.replace(/\\\$/g, DOLLAR_PLACEHOLDER);
  
  // Split the content into segments: math or text
  const segments = [];
  let currentPos = 0;
  
  // Find all math expressions: both display ($$..$$) and inline ($...$)
  const mathRegex = /(\$\$[\s\S]+?\$\$)|(\$[\s\S]+?\$)/g;
  let match;
  
  while ((match = mathRegex.exec(content)) !== null) {
    // Add text before the math expression
    if (match.index > currentPos) {
      segments.push({
        type: 'text',
        content: content.slice(currentPos, match.index)
      });
    }
    
    // Determine if it's display or inline math
    const isDisplay = match[0].startsWith('$$');
    
    // Extract the math expression without the delimiters
    const mathContent = isDisplay 
      ? match[0].slice(2, -2) // Remove $$ at both ends
      : match[0].slice(1, -1); // Remove $ at both ends
    
    segments.push({
      type: isDisplay ? 'display-math' : 'inline-math',
      content: mathContent
    });
    
    currentPos = match.index + match[0].length;
  }
  
  // Add any remaining text
  if (currentPos < content.length) {
    segments.push({
      type: 'text',
      content: content.slice(currentPos)
    });
  }
  
  // Render each segment
  const renderedContent = segments.map(segment => {
    if (segment.type === 'text') {
      // For text segments, handle basic HTML formatting
      return segment.content
        .replace(/\n/g, '<br>')
        .replace(new RegExp(DOLLAR_PLACEHOLDER, 'g'), '$');
    } else {
      // For math segments, use KaTeX
      try {
        const isDisplay = segment.type === 'display-math';

        // Replace the placeholder with the actual KaTeX command for dollar sign
        const processedMathContent = segment.content
          .replace(new RegExp(DOLLAR_PLACEHOLDER, 'g'), '\\$');
        
        return katex.renderToString(processedMathContent, {
          throwOnError: false,
          displayMode: isDisplay,
          output: 'html'
        });
      } catch (err) {
        console.error('KaTeX error:', err);
        return `<span class="katex-error">${segment.content}</span>`;
      }
    }
  }).join('');
  
  return renderedContent;
};

/**
 * Main content rendering function using KaTeX
 */
export const renderMathContent = (content) => {
  if (!content) return '';
  
  // First handle special cases like tables
  content = processTableFormat(content);
  
  // Process the content to handle math expressions with KaTeX
  return processWithKaTeX(content);
};

/**
 * Enhanced processMathInText function to handle diagrams and math expressions
 * This maintains the React component-based approach for compatibility
 */
export const processMathInText = (content) => {
  if (typeof content !== 'string') return content;

  // First, handle tables
  content = processTableFormat(content);

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
            <span className="math-container math-inline" key={`inline-math-${i}-${j}`}>
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
        <div className="math-container math-block" key={`block-math-${i}`}>
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

/**
 * Non-React string rendering function that uses processWithKaTeX directly
 * For use in components that need string output instead of React elements
 */
export const renderMathString = (content) => {
  if (!content) return '';
  
  // Normalize underscores - replace more than 5 consecutive underscores with just 5
  content = content.replace(/_{6,}/g, '_____');
  
  return renderMathContent(content);
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

// Inject the global CSS styles for math rendering
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = `
    /* Font declarations */
    @font-face {
      font-family: 'Computer Modern';
      src: url('../../public/fonts/cmunrm.woff2') format('woff2');
      font-weight: normal;
      font-style: normal;
    }
    
    @font-face {
      font-family: 'Computer Modern';
      src: url('../../public/fonts/cmunti.woff2') format('woff2');
      font-weight: normal;
      font-style: italic;
    }
    
    @font-face {
      font-family: 'Computer Modern';
      src: url('../../public/fonts/cmunbx.woff2') format('woff2');
      font-weight: bold;
      font-style: normal;
    }
  
    /* Core styling for math and text content */
    .question-text-container,
    .math-container,
    .math-renderer {
      font-family: 'Noto Sans', sans-serif;
      line-height: 1.6;
      color: #333;
    }
    
    /* KaTeX styling */
    .katex {
      font-family: 'Computer Modern', KaTeX_Main, serif !important;
      font-size: 1.1em !important;
    }
  
    .math-question,
    .question-text-container .katex,
    .math-content .katex,
    .math-container .katex {
      font-family: 'Computer Modern', KaTeX_Main, serif !important;
    }
    
    .katex-display {
      margin: 1em 0 !important;
      overflow-x: auto !important;
      overflow-y: hidden !important;
    }
  
    .katex-display + :not(.katex-display),
    :not(.katex-display) + .katex {
      margin-left: 0.2em !important;
    }
  
    /* Improved fraction styling */
    .katex .mfrac {
      vertical-align: middle !important; /* Center the fraction vertically */
      font-size: 1.2em !important; /* Slightly larger for better readability */
    }
  
    /* Make the fraction bar look like the reference image */
    .katex .mfrac .frac-line {
      border-top-width: 1px !important;
      border-bottom-width: 1px !important;
      margin-top: 0.15em !important;
      margin-bottom: 0.15em !important;
      min-width: 0.7em !important; /* Ensure minimum width for the line */
    }
  
    /* Position the numerator properly */
    .katex .mfrac .mfracnum {
      display: flex !important;
      justify-content: center !important;
      margin-bottom: 0.2em !important;
      min-height: 1em !important;
    }
  
    /* Position the denominator properly */
    .katex .mfrac .mfracdenom {
      display: flex !important;
      justify-content: center !important;
      margin-top: 0.2em !important;
      min-height: 1em !important;
    }
  
    /* Ensure proper spacing for negative fractions */
    .katex .mfrac .mord.mtight {
      padding: 0 0.05em !important;
    }
  
    /* Fix spacing for the radical symbols and exponents */
    .katex .mfrac .sqrt {
      padding: 0.1em 0 !important;
    }
  
    .katex .mord {
      font-family: 'Computer Modern', KaTeX_Main, serif !important;
    }
  
    .katex .mord.mathit {
      font-family: 'Computer Modern', KaTeX_Math, serif !important;
      font-style: italic !important;
    }
  
    .katex .mord + .mord {
      margin-left: 0.05em !important;
    }
  
    .katex .mclose + .msup {
      margin-left: 0.08em !important;
    }
  
    .katex .msup + .mclose,
    .katex .msup + .mord,
    .katex .msup + .mbin,
    .katex .msup + .mrel,
    .katex .msup + .mpunct {
      margin-left: 0.08em !important;
    }
  
    .katex .msup + .mpunct {
      margin-left: 0.12em !important; 
    }
  
    .katex .minner {
      padding: 0 0.05em !important;
    }
  
    /* Complete redo of not equal signs styling */
    .katex .mrel.negated {
      position: relative !important;
      display: inline-block !important;
      margin: 0 0.2em !important;
    }
  
    /* Hide the default diagonal implementation which isn't working */
    .katex .mrel.negated .vlist-t2 .vlist-r:nth-child(2) .vlist {
      opacity: 0 !important;
    }
  
    /* Create a new clean diagonal line with pseudo-element */
    .katex .mrel.negated:after {
      content: '' !important;
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: linear-gradient(to top right, 
        transparent calc(50% - 0.5px), 
        currentColor, 
        transparent calc(50% + 0.5px)) !important;
      transform: rotate(-10deg) !important; /* Slight rotation for better alignment */
      pointer-events: none !important;
    }
  
    /* Ensure the equals sign itself is properly displayed */
    .katex .mrel.negated .vlist-t2 .vlist-r:first-child .vlist {
      display: block !important;
    }
  
    .katex .msupsub .msup {
      margin-right: 0.1em !important;
    }
  
    .katex .msup {
      padding-right: 0.05em !important;
    }
    
    .katex .msupsub {
      text-align: left !important;
      position: absolute !important;
      margin-right: 0.1em !important;
    }
    
    .katex .mfrac > span {
      display: inline-block !important;
    }
  
    .katex .mbin, .katex .mrel {
      margin: 0 0.2em !important;
    }
    
    /* Table styling */
    .question-text-container table,
    .math-container table {
      border-collapse: collapse;
      margin: 1em 0;
    }
    
    .question-text-container th,
    .question-text-container td,
    .math-container th,
    .math-container td {
      border: 1px solid #e5e7eb;
      padding: 8px 12px;
      text-align: left;
    }
    
    .question-text-container th,
    .math-container th {
      background-color: #f9fafb;
      font-weight: 600;
    }
    
    /* Error indication */
    .katex-error {
      color: #cc0000;
      background-color: #ffeeee;
      padding: 2px 4px;
      border-radius: 3px;
    }
    
    /* Better spacing between elements */
    .question-text-container p, 
    .question-text-container br + br,
    .math-container p,
    .math-container br + br {
      margin-top: 0.5em;
    }

    /* Block math specific styling */
    .math-block {
      display: block;
      margin: 1em 0;
      text-align: center;
    }
    
    /* Diagram styling */
    .math-diagram {
      margin: 1em auto;
      text-align: center;
    }
    
    .math-diagram img {
      max-width: 100%;
      height: auto;
    }
  `;
  
  document.head.appendChild(styleElement);
}

export default MathRenderer; 