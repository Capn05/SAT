import { useState, useRef, useCallback } from 'react';

export function useChat({ 
  api = '/api/chat', 
  initialMessages = [],
  onFinish = () => {},
  questionContext = {} 
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const abortControllerRef = useRef(null);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const append = useCallback(async (message) => {
    // Add user message
    const userMessage = {
      id: Date.now() + '-user',
      role: 'user',
      content: message.content,
      createdAt: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    // Create assistant message placeholder
    const assistantMessage = {
      id: Date.now() + '-assistant',
      role: 'assistant',
      content: '',
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          questionContext,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Process streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setMessages(prev => {
                const finalMessages = prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { ...msg, createdAt: new Date() }
                    : msg
                );
                const finalAssistantMessage = finalMessages.find(msg => msg.id === assistantMessage.id);
                if (finalAssistantMessage) {
                  onFinish(finalAssistantMessage);
                }
                return finalMessages;
              });
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessage.id 
                    ? { ...msg, content: msg.content + parsed.content }
                    : msg
                ));
              }
            } catch (e) {
              // Ignore parsing errors for partial chunks
            }
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        // Remove incomplete assistant message on abort
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessage.id));
      } else {
        console.error('Chat error:', error);
        // Add error message
        const errorMessage = {
          id: Date.now() + '-error',
          role: 'assistant',
          content: 'Sorry, there was an error processing your request.',
          createdAt: new Date(),
        };
        setMessages(prev => [...prev.slice(0, -1), errorMessage]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, api, questionContext, onFinish]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    append({ content: input });
    setInput('');
  }, [input, isLoading, append]);

  const reload = useCallback(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'user') {
      const lastUserMessage = messages[messages.length - 1];
      setMessages(prev => prev.slice(0, -1));
      append(lastUserMessage);
    }
  }, [messages, append]);

  const clear = useCallback(() => {
    setMessages([]);
    setInput('');
    stop();
  }, [stop]);

  return {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    stop,
    append,
    reload,
    clear,
  };
} 