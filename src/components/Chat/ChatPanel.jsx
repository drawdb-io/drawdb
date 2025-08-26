import React, { useState, useRef, useEffect } from 'react';
import { 
  Button, 
  Input, 
  Modal, 
  Typography, 
  Spin, 
  Card,
  Space,
  Divider 
} from '@douyinfe/semi-ui';
import { 
  IconSend, 
  IconSettings, 
  IconClose, 
  IconClear,
  IconChevronRight,
  IconChevronLeft 
} from '@douyinfe/semi-icons';
import { useChat } from '../../context/ChatContext';
import { useDiagram } from '../../hooks';
import PreviewModal from './PreviewModal';
import { useTranslation } from 'react-i18next';

const { Text, Paragraph } = Typography;

const ChatPanel = () => {
  const { t } = useTranslation();
  const {
    messages,
    isTyping,
    apiKey,
    isConfigured,
    isOpen,
    sendMessage,
    clearMessages,
    configureApiKey,
    generateTables,
    toggleChat,
    setIsOpen,
  } = useChat();
  
  const { addTable, addRelationship } = useDiagram();

  const [inputValue, setInputValue] = useState('');
  const [showApiModal, setShowApiModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [creatingTables, setCreatingTables] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !isConfigured) return;
    
    const message = inputValue.trim();
    setInputValue('');
    
    // Check if message is a table generation command
    const isTableCommand = message.toLowerCase().includes('criar') && 
                          (message.toLowerCase().includes('tabela') || 
                           message.toLowerCase().includes('banco') ||
                           message.toLowerCase().includes('estrutura'));
    
    if (isTableCommand) {
      try {
        const result = await generateTables(message);
        if (result && result.tables && result.tables.length > 0) {
          setPreviewData(result);
          setShowPreview(true);
          return;
        }
      } catch (error) {
        console.error('Error generating tables:', error);
      }
    }
    
    // Send regular message
    sendMessage(message);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleConfigureApi = () => {
    setTempApiKey(apiKey);
    setShowApiModal(true);
  };

  const handleSaveApiKey = () => {
    configureApiKey(tempApiKey);
    setShowApiModal(false);
    setTempApiKey('');
  };

  const handleApprovePreview = async (selectedData) => {
    try {
      setCreatingTables(true);
      
      // Create tables in the diagram
      for (const table of selectedData.tables) {
        await addTable({
          name: table.name,
          fields: table.fields.map(field => ({
            ...field,
            // Ensure all required field properties
            notNull: field.notNull !== false,
            primary: field.primary || false,
            unique: field.unique || false,
            increment: field.increment || false,
            comment: field.comment || '',
            default: field.default || '',
          })),
          x: Math.random() * 400 + 100, // Random position
          y: Math.random() * 300 + 100,
          color: '#3B82F6', // Default blue
        });
      }
      
      // TODO: Create relationships
      // for (const rel of selectedData.relationships) {
      //   await addRelationship(rel);
      // }
      
      // Add success message
      const successMessage = {
        role: 'assistant',
        content: `✅ Criadas ${selectedData.tables.length} tabela(s) com sucesso! Verifique o canvas do diagrama.`,
        sender: 'ai',
      };
      
      clearMessages();
      setTimeout(() => {
        setMessages([successMessage]);
      }, 100);
      
      setShowPreview(false);
      setPreviewData(null);
      
    } catch (error) {
      console.error('Error creating tables:', error);
      const errorMessage = {
        role: 'assistant',
        content: `❌ Erro ao criar tabelas: ${error.message}`,
        sender: 'ai',
        error: true,
      };
      
      setTimeout(() => {
        setMessages(prev => [...prev, errorMessage]);
      }, 100);
    } finally {
      setCreatingTables(false);
    }
  };

  const handleRejectPreview = () => {
    setShowPreview(false);
    setPreviewData(null);
    
    const rejectMessage = {
      role: 'assistant',
      content: 'Operação cancelada. Posso te ajudar a criar uma estrutura diferente?',
      sender: 'ai',
    };
    
    setTimeout(() => {
      setMessages(prev => [...prev, rejectMessage]);
    }, 100);
  };

  const formatMessage = (message) => {
    return message.content.split('\n').map((line, index) => (
      <div key={index}>
        {line}
        {index < message.content.split('\n').length - 1 && <br />}
      </div>
    ));
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <div 
        className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50"
        style={{ marginRight: isOpen ? '400px' : '0px', transition: 'margin-right 0.3s ease' }}
      >
        <Button
          icon={isOpen ? <IconChevronRight /> : <IconChevronLeft />}
          size="large"
          theme="solid"
          type="primary"
          onClick={toggleChat}
          style={{
            borderRadius: '8px 0 0 8px',
            minHeight: '48px',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
          }}
        >
          {isOpen ? '' : 'AI Chat'}
        </Button>
      </div>

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed right-0 top-0 h-full w-[400px] bg-white border-l border-gray-200 shadow-lg z-40"
          style={{
            backgroundColor: 'var(--semi-color-bg-1)',
            borderColor: 'var(--semi-color-border)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Text strong size="large">🤖 AI Assistant</Text>
              {!isConfigured && (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
            <Space>
              <Button
                icon={<IconSettings />}
                size="small"
                type="tertiary"
                onClick={handleConfigureApi}
                title="Configurar API Key"
              />
              <Button
                icon={<IconClear />}
                size="small"
                type="tertiary"
                onClick={clearMessages}
                title="Limpar conversa"
              />
              <Button
                icon={<IconClose />}
                size="small"
                type="tertiary"
                onClick={() => setIsOpen(false)}
                title="Fechar chat"
              />
            </Space>
          </div>

          {/* Configuration Warning */}
          {!isConfigured && (
            <Card
              className="m-4"
              style={{ backgroundColor: 'var(--semi-color-warning-light-default)' }}
            >
              <Text size="small">
                ⚠️ Configure sua OpenAI API Key para usar o chat AI.
              </Text>
              <Button
                size="small"
                type="primary"
                className="mt-2"
                onClick={handleConfigureApi}
              >
                Configurar
              </Button>
            </Card>
          )}

          {/* Messages Area */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-4"
            style={{ height: 'calc(100vh - 180px)' }}
          >
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <Text type="tertiary">
                  Olá! Sou seu assistente AI para criação de diagramas de banco de dados.
                  <br /><br />
                  Posso te ajudar a:
                  <br />• Criar tabelas automaticamente
                  <br />• Gerar relacionamentos
                  <br />• Sugerir estruturas de dados
                  <br /><br />
                  {isConfigured ? 'Digite sua mensagem abaixo!' : 'Configure sua API Key para começar.'}
                </Text>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : message.error
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="text-sm">
                      {formatMessage(message)}
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                  <Spin size="small" />
                  <Text size="small" className="ml-2">AI está digitando...</Text>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <Input
                placeholder={isConfigured ? "Digite sua mensagem..." : "Configure a API Key primeiro"}
                value={inputValue}
                onChange={setInputValue}
                onKeyPress={handleKeyPress}
                disabled={!isConfigured}
                className="flex-1"
                autoSize={{ minRows: 1, maxRows: 3 }}
              />
              <Button
                icon={<IconSend />}
                type="primary"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || !isConfigured || isTyping}
              />
            </div>
          </div>
        </div>
      )}

      {/* API Key Configuration Modal */}
      <Modal
        title="Configurar OpenAI API Key"
        visible={showApiModal}
        onOk={handleSaveApiKey}
        onCancel={() => setShowApiModal(false)}
        okText="Salvar"
        cancelText="Cancelar"
        okButtonProps={{ disabled: !tempApiKey.trim() }}
      >
        <div className="space-y-4">
          <Text>
            Insira sua OpenAI API Key para habilitar o chat AI:
          </Text>
          <Input.Password
            placeholder="sk-..."
            value={tempApiKey}
            onChange={setTempApiKey}
            showClear
          />
          <Text size="small" type="tertiary">
            Sua API key é armazenada localmente no navegador e não é compartilhada.
            <br />
            Obtenha sua key em: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">platform.openai.com/api-keys</a>
          </Text>
        </div>
      </Modal>

      {/* Preview Modal for Table Generation */}
      <PreviewModal
        visible={showPreview}
        onCancel={() => setShowPreview(false)}
        onApprove={handleApprovePreview}
        onReject={handleRejectPreview}
        previewData={previewData}
        loading={creatingTables}
      />
    </>
  );
};

export default ChatPanel;