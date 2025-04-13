import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage, ChatRequest, createChatStream } from '@/lib/api';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Clean up any streams on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  const sendMessage = useCallback(async (content: string) => {
    // Add user message to chat
    const userMessage: ChatMessage = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    
    // Initialize assistant message
    const assistantMessage: ChatMessage = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(true);
    
    // Cancel any previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new abort controller
    abortControllerRef.current = new AbortController();
    
    try {
      const chatRequest: ChatRequest = {
        messages: [...messages, userMessage],
        stream: true
      };
      
      const stream = await createChatStream(chatRequest);
      
      if (!stream) {
        throw new Error('Failed to create stream');
      }
      
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        // Process the streamed data
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              continue;
            }
            
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.token) {
                accumulatedResponse += parsed.token;
                
                // Update the last message with the accumulated response
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: accumulatedResponse
                  };
                  return updated;
                });
              }
              
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat stream error:', error);
      setMessages(prev => {
        const updated = [...prev];
        
        // Update the last message with the error
        if (updated.length > 0) {
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: 'Error: Failed to generate response. Please try again.'
          };
        }
        
        return updated;
      });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages]);
  
  const resetChat = useCallback(() => {
    setMessages([]);
  }, []);
  
  return {
    messages,
    isLoading,
    sendMessage,
    resetChat
  };
} 