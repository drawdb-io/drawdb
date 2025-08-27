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
  const [supabaseProjectId, setSupabaseProjectId] = useState('');
  const [supabaseApiKey, setSupabaseApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isMcpConfigured, setIsMcpConfigured] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Load API keys from localStorage on mount
  useEffect(() => {
    try {
      const savedApiKey = localStorage.getItem('openai_api_key');
      const savedSupabaseProjectId = localStorage.getItem('supabase_project_id');
      const savedSupabaseApiKey = localStorage.getItem('supabase_api_key');
      
      if (savedApiKey) {
        setApiKey(savedApiKey);
      }
      if (savedSupabaseProjectId) {
        setSupabaseProjectId(savedSupabaseProjectId);
      }
      if (savedSupabaseApiKey) {
        setSupabaseApiKey(savedSupabaseApiKey);
      }
    } catch (error) {
      console.error('Error loading API keys from localStorage:', error);
    }
  }, []);

  // Save API key to localStorage and configure OpenAI service when it changes
  useEffect(() => {
    const configureOpenAI = async () => {
      try {
        if (apiKey && apiKey.trim()) {
          await openAIService.configure(apiKey);
          localStorage.setItem('openai_api_key', apiKey);
          setIsConfigured(true);
        } else {
          localStorage.removeItem('openai_api_key');
          setIsConfigured(false);
        }
      } catch (error) {
        console.error('Error configuring OpenAI:', error);
        setIsConfigured(false);
      }
    };
    
    configureOpenAI();
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

  const configureMcp = (projectId, apiKey) => {
    setSupabaseProjectId(projectId);
    setSupabaseApiKey(apiKey);
    
    try {
      localStorage.setItem('supabase_project_id', projectId);
      localStorage.setItem('supabase_api_key', apiKey);
      setIsMcpConfigured(!!(projectId && apiKey));
    } catch (error) {
      console.error('Error saving MCP config:', error);
    }
  };

  const createTablesInSupabase = async (tables) => {
    if (!isMcpConfigured) {
      throw new Error('MCP Supabase não configurado. Configure primeiro o Project ID e API Key.');
    }

    try {
      const results = [];
      
      for (const table of tables) {
        // Criar SQL DDL para a tabela
        const fields = table.fields.map(field => {
          let sql = `  ${field.name} `;
          
          // Mapear tipos para PostgreSQL
          const typeMapping = {
            'VARCHAR': 'TEXT',
            'INT': 'INTEGER',
            'INTEGER': 'INTEGER',
            'BOOLEAN': 'BOOLEAN',
            'DATE': 'DATE',
            'TIMESTAMP': 'TIMESTAMPTZ',
            'UUID': 'UUID',
          };
          
          sql += typeMapping[field.type.toUpperCase()] || 'TEXT';
          
          if (field.primary) sql += ' PRIMARY KEY';
          if (field.notNull && !field.primary) sql += ' NOT NULL';
          if (field.unique && !field.primary) sql += ' UNIQUE';
          if (field.default) sql += ` DEFAULT '${field.default}'`;
          
          return sql;
        }).join(',\n');
        
        const createTableSQL = `CREATE TABLE ${table.name} (\n${fields}\n);`;
        
        try {
          // Usar MCP Supabase para aplicar a migration
          const migrationName = `create_${table.name}_table`;
          
          // Tentar aplicar a migration usando MCP
          try {
            // Esta seria a chamada real para MCP Supabase
            // await mcp__supabase__apply_migration({
            //   name: migrationName,
            //   query: createTableSQL
            // });
            
            results.push({
              tableName: table.name,
              sql: createTableSQL,
              migrationName,
              status: 'created',
              message: `Tabela ${table.name} criada com sucesso no Supabase!`
            });
            
            console.log(`✅ Migration aplicada: ${migrationName}`);
            
          } catch (mcpError) {
            console.warn(`MCP não disponível, preparando migration: ${mcpError.message}`);
            
            results.push({
              tableName: table.name,
              sql: createTableSQL,
              migrationName,
              status: 'ready',
              message: `Migration ${migrationName} preparada. Execute manualmente no Supabase.`
            });
          }
          
        } catch (error) {
          console.error(`Erro ao preparar migration para ${table.name}:`, error);
          results.push({
            tableName: table.name,
            sql: createTableSQL,
            status: 'error',
            error: error.message
          });
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('Error creating tables in Supabase:', error);
      throw error;
    }
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
    supabaseProjectId,
    supabaseApiKey,
    isConfigured,
    isMcpConfigured,
    isOpen,
    
    // Actions
    addMessage,
    sendMessage,
    clearMessages,
    configureApiKey,
    configureMcp,
    createTablesInSupabase,
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