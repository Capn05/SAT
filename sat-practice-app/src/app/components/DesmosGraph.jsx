'use client';
import { useEffect, useRef } from 'react';

export default function DesmosGraph({ expressions, width = '100%', height = '400px' }) {
  const containerRef = useRef(null);
  const calculatorRef = useRef(null);

  useEffect(() => {
    // Load Desmos Calculator script
    const script = document.createElement('script');
    script.src = 'https://www.desmos.com/api/v1.8/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6';
    script.async = true;
    script.onload = () => {
      if (containerRef.current && window.Desmos) {
        // Initialize calculator
        calculatorRef.current = window.Desmos.GraphingCalculator(containerRef.current, {
          expressions: false,
          settingsMenu: false,
          zoomButtons: false,
          lockViewport: true,
          border: false
        });

        // Add expressions
        if (expressions && expressions.length > 0) {
          expressions.forEach(expr => {
            calculatorRef.current.setExpression({ latex: expr });
          });
        }
      }
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (calculatorRef.current) {
        calculatorRef.current.destroy();
      }
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    // Update expressions when they change
    if (calculatorRef.current && expressions) {
      calculatorRef.current.removeExpressions(calculatorRef.current.getExpressions());
      expressions.forEach(expr => {
        calculatorRef.current.setExpression({ latex: expr });
      });
    }
  }, [expressions]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: width, 
        height: height,
        margin: '20px 0',
        border: '1px solid #ddd',
        borderRadius: '8px',
        overflow: 'hidden'
      }} 
    />
  );
} 