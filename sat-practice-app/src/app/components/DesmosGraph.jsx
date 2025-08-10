'use client';
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';

const DesmosGraph = forwardRef(({ 
  expressions = [], 
  width = '100%', 
  height = '400px',
  interactive = false,
  keypad = false,
  settingsMenu = false,
  zoomButtons = false,
  border = true,
  mathBounds,
  onExpressionChange,
  className = '',
  style = {}
}, ref) => {
  const containerRef = useRef(null);
  const calculatorRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useImperativeHandle(ref, () => ({
    getCalculator: () => calculatorRef.current,
    setExpression: (expr) => calculatorRef.current?.setExpression(expr),
    clearAll: () => calculatorRef.current?.setBlank(),
    getState: () => calculatorRef.current?.getState(),
    setState: (state) => calculatorRef.current?.setState(state),
    isReady
  }));

  useEffect(() => {
    // Check if Desmos is already loaded globally
    if (window.Desmos) {
      initializeCalculator();
      return;
    }

    // Check if script is already being loaded
    let script = document.querySelector('script[src*="desmos.com/api"]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://www.desmos.com/api/v1.8/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6';
      script.async = true;
      script.onload = initializeCalculator;
      document.head.appendChild(script);
    } else {
      // Script exists, wait for it to load
      script.onload = initializeCalculator;
      // If already loaded, initialize immediately
      if (window.Desmos) {
        initializeCalculator();
      }
    }

    return () => {
      if (calculatorRef.current) {
        calculatorRef.current.destroy();
        calculatorRef.current = null;
      }
    };
  }, []);

  const initializeCalculator = () => {
    if (containerRef.current && window.Desmos && !calculatorRef.current) {
      try {
        calculatorRef.current = window.Desmos.GraphingCalculator(containerRef.current, {
          expressions: interactive,
          settingsMenu: interactive ? settingsMenu : false,
          zoomButtons: interactive ? zoomButtons : false,
          keypad: interactive ? keypad : false,
          lockViewport: !interactive,
          border,
          autosize: true,
          // Additional options for better SAT test experience
          expressionsTopbar: interactive,
          pointsOfInterest: interactive,
          trace: interactive,
          folders: false,
          notes: false,
          images: false,
          links: false,
          projectorMode: false,
          fontSize: 14
        });

        // Set appropriate math bounds
        const bounds = mathBounds || { left: -10, right: 10, bottom: -10, top: 10 };
        calculatorRef.current.setMathBounds(bounds);

        // Set up expression change listener if provided
        if (onExpressionChange && interactive) {
          calculatorRef.current.observeEvent('change', () => {
            const state = calculatorRef.current.getState();
            onExpressionChange(state.expressions);
          });
        }

        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize Desmos calculator:', error);
      }
    }
  };

  useEffect(() => {
    if (calculatorRef.current && isReady && expressions.length > 0) {
      try {
        // Clear existing expressions first
        calculatorRef.current.setBlank();
        
        // Add new expressions
        expressions.forEach((expr, index) => {
          const expression = typeof expr === 'string' 
            ? { id: `expr_${index}`, latex: expr }
            : { id: `expr_${index}`, ...expr };
          
          calculatorRef.current.setExpression(expression);
        });
      } catch (error) {
        console.error('Failed to set expressions:', error);
      }
    }
  }, [expressions, isReady]);

  const containerStyle = {
    width,
    height,
    border: border ? '1px solid #e5e7eb' : 'none',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#fff',
    ...style
  };

  return (
    <div 
      ref={containerRef} 
      className={className}
      style={containerStyle}
    />
  );
});

DesmosGraph.displayName = 'DesmosGraph';
export default DesmosGraph; 