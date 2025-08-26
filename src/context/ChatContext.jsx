import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import openAIService from '../services/openai';

const ChatContext = createContext({});

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setIsConfigured(true);
    }
  }, []);

  // Save API key to localStorage and configure OpenAI service when it changes
  useEffect(() => {
    if (apiKey) {
      try {
        openAIService.configure(apiKey);
        localStorage.setItem('openai_api_key', apiKey);
        setIsConfigured(true);
      } catch (error) {
        console.error('Error configuring OpenAI:', error);
        setIsConfigured(false);
      }
    } else {
      localStorage.removeItem('openai_api_key');
      setIsConfigured(false);
    }
  }, [apiKey]);

  const addMessage = (message) => {
    setMessages(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        ...message,
      }
    ]);
  };

  const sendMessage = async (content) => {
    if (!content.trim() || !isConfigured) return;

    // Add user message
    const userMessage = {
      role: 'user',
      content: content.trim(),
      sender: 'user',
    };
    addMessage(userMessage);

    try {
      setIsTyping(true);
      
      // Use real OpenAI API
      const response = await openAIService.sendMessage(content.trim(), {
        currentProject: null, // TODO: Get from ProjectsContext
        existingTables: [], // TODO: Get from DiagramContext
      });
      
      const aiMessage = {
        role: 'assistant', 
        content: response,
        sender: 'ai',
      };
      addMessage(aiMessage);
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: `Erro: ${error.message}`,
        sender: 'ai',
        error: true,
      };
      addMessage(errorMessage);
    } finally {
      setIsTyping(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const configureApiKey = (newApiKey) => {
    setApiKey(newApiKey);
  };

  const generateTables = async (description) => {
    if (!description.trim() || !isConfigured) return null;

    try {
      setIsTyping(true);
      
      const result = await openAIService.generateTables(description.trim(), {
        // TODO: Pass current diagram context
      });
      
      return result;
      
    } catch (error) {
      console.error('Error generating tables:', error);
      const errorMessage = {
        role: 'assistant',
        content: `Erro ao gerar tabelas: ${error.message}`,
        sender: 'ai',
        error: true,
      };
      addMessage(errorMessage);
      return null;
    } finally {
      setIsTyping(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(prev => !prev);
  };

  const value = {
    // State
    messages,
    isTyping,
    apiKey,
    isConfigured,
    isOpen,
    
    // Actions
    addMessage,
    sendMessage,
    clearMessages,
    configureApiKey,
    generateTables,
    toggleChat,
    setIsOpen,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};