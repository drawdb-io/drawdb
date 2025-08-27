import React, { useState, useRef, useEffect } from 'react';
import { nanoid } from 'nanoid';
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
  IconConfigStroked, 
  IconClose, 
  IconClear,
  IconChevronRight,
  IconChevronLeft,
  IconServer
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
    supabaseProjectId,
    supabaseApiKey,
    isConfigured,
    isMcpConfigured,
    isOpen,
    sendMessage,
    addMessage,
    clearMessages,
    configureApiKey,
    configureMcp,
    createTablesInSupabase,
    generateTables,
    toggleChat,
    setIsOpen,
  } = useChat();
  
  const { addTable, addRelationship } = useDiagram();

  const [inputValue, setInputValue] = useState('');
  const [showApiModal, setShowApiModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [showMcpModal, setShowMcpModal] = useState(false);
  const [tempSupabaseProjectId, setTempSupabaseProjectId] = useState('');
  const [tempSupabaseApiKey, setTempSupabaseApiKey] = useState('');
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
    
    // Use AI to detect table creation intent
    try {
      const result = await generateTables(message);
      if (result && result.tables && result.tables.length > 0) {
        setPreviewData(result);
        setShowPreview(true);
        return;
      }
    } catch (error) {
      console.error('Error generating tables:', error);
      // If table generation fails, continue with regular chat
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

  const handleConfigureMcp = () => {
    setTempSupabaseProjectId(supabaseProjectId);
    setTempSupabaseApiKey(supabaseApiKey);
    setShowMcpModal(true);
  };

  const handleSaveMcpConfig = () => {
    configureMcp(tempSupabaseProjectId, tempSupabaseApiKey);
    setShowMcpModal(false);
    setTempSupabaseProjectId('');
    setTempSupabaseApiKey('');
  };

  const handleApprovePreview = async (selectedData) => {
    try {
      setCreatingTables(true);
      
      // Create tables in the diagram and keep track of them
      const createdTables = [];
      for (const table of selectedData.tables) {
        try {
          const newTable = {
            id: nanoid(),
            name: table.name,
            x: Math.random() * 400 + 100, // Random position
            y: Math.random() * 300 + 100,
            locked: false,
            fields: table.fields?.map(field => ({
              id: nanoid(),
              name: field.name || "",
              type: field.type || "VARCHAR",
              default: field.default || "",
              check: field.check || "",
              primary: field.primary || false,
              unique: field.unique || false,
              notNull: field.notNull !== false, // Default to true unless explicitly false
              increment: field.increment || false,
              comment: field.comment || ""
            })) || [],
            comment: table.comment || "",
            indices: table.indices || [],
            color: '#3B82F6', // Default blue
          };
          
          addTable(newTable);
          createdTables.push(newTable);
        } catch (tableError) {
          console.error('Error creating individual table:', tableError);
        }
      }
      
      // Create relationships if any exist
      if (selectedData.relationships && selectedData.relationships.length > 0) {
        // Use a timeout to allow tables to be added to state first
        setTimeout(() => {
          for (const rel of selectedData.relationships) {
            try {
              // Find the tables and fields by name in created tables
              const startTable = createdTables.find(t => t.name === rel.startTableName);
              const endTable = createdTables.find(t => t.name === rel.endTableName);
              
              if (startTable && endTable) {
                const startField = startTable.fields.find(f => f.name === rel.startFieldName);
                const endField = endTable.fields.find(f => f.name === rel.endFieldName);
                
                if (startField && endField) {
                  const relationshipData = {
                    id: nanoid(),
                    name: `${rel.startTableName}_${rel.endTableName}`,
                    startTableId: startTable.id,
                    endTableId: endTable.id,
                    startFieldId: startField.id,
                    endFieldId: endField.id,
                    cardinality: rel.cardinality || 'one_to_many',
                    updateConstraint: 'No action',
                    deleteConstraint: 'No action',
                  };
                  
                  addRelationship(relationshipData);
                }
              }
            } catch (relationshipError) {
              console.error('Error creating individual relationship:', relationshipError);
            }
          }
        }, 100); // Small delay to ensure tables are in state
      }
      
      // Add success message
      const successMessage = {
        role: 'assistant',
        content: `✅ Criadas ${selectedData.tables.length} tabela(s) com sucesso! Verifique o canvas do diagrama.`,
        sender: 'ai',
      };
      
      addMessage(successMessage);
      
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
      
      addMessage(errorMessage);
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
    
    addMessage(rejectMessage);
  };

  const handleCreateInSupabase = async (selectedData) => {
    try {
      setCreatingTables(true);
      
      if (!isMcpConfigured) {
        const errorMessage = {
          role: 'assistant',
          content: '❌ MCP Supabase não configurado. Configure primeiro nas opções do chat.',
          sender: 'ai',
          error: true,
        };
        addMessage(errorMessage);
        return;
      }
      
      const results = await createTablesInSupabase(selectedData.tables);
      
      // Simular criação das migrations (no futuro será MCP real)
      const successMessage = {
        role: 'assistant', 
        content: `✅ Preparadas ${results.length} migration(s) para Supabase!\n\nTabelas prontas para criação:\n${results.map(r => `• ${r.tableName} (${r.migrationName})`).join('\n')}\n\n📝 Verifique os logs para ver o SQL gerado.`,
        sender: 'ai',
      };
      
      addMessage(successMessage);
      
      setShowPreview(false);
      setPreviewData(null);
      
    } catch (error) {
      console.error('Error creating in Supabase:', error);
      const errorMessage = {
        role: 'assistant',
        content: `❌ Erro ao criar no Supabase: ${error.message}`,
        sender: 'ai',
        error: true,
      };
      addMessage(errorMessage);
    } finally {
      setCreatingTables(false);
    }
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
              {!isMcpConfigured && (
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              )}
            </div>
            <Space>
              <Button
                icon={<IconConfigStroked />}
                size="small"
                type="tertiary"
                onClick={handleConfigureApi}
                title="Configurar OpenAI API Key"
              />
              <Button
                icon={<IconServer />}
                size="small"
                type="tertiary"
                onClick={handleConfigureMcp}
                title="Configurar MCP Supabase"
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

          {/* Configuration Warnings */}
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
                Configurar OpenAI
              </Button>
            </Card>
          )}
          
          {isConfigured && !isMcpConfigured && (
            <Card
              className="m-4"
              style={{ backgroundColor: 'var(--semi-color-primary-light-default)' }}
            >
              <Text size="small">
                🔧 Configure MCP Supabase para criar tabelas direto no banco de dados.
              </Text>
              <Button
                size="small"
                type="primary"
                className="mt-2"
                onClick={handleConfigureMcp}
              >
                Configurar MCP
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
          <Input
            type="password"
            placeholder="sk-..."
            value={tempApiKey}
            onChange={setTempApiKey}
          />
          <Text type="tertiary" style={{ fontSize: '12px' }}>
            Sua API key é armazenada localmente no navegador e não é compartilhada.
            <br />
            Obtenha sua key em: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">platform.openai.com/api-keys</a>
          </Text>
        </div>
      </Modal>

      {/* MCP Supabase Configuration Modal */}
      <Modal
        title="Configurar MCP Supabase"
        visible={showMcpModal}
        onOk={handleSaveMcpConfig}
        onCancel={() => setShowMcpModal(false)}
        okText="Salvar"
        cancelText="Cancelar"
        okButtonProps={{ disabled: !tempSupabaseProjectId.trim() || !tempSupabaseApiKey.trim() }}
        width={500}
      >
        <div className="space-y-4">
          <Text>
            Configure sua conexão Supabase para permitir que a IA crie tabelas direto no seu banco de dados:
          </Text>
          
          <div>
            <Text strong>Project ID do Supabase:</Text>
            <Input
              placeholder="abcdefghijklmnop"
              value={tempSupabaseProjectId}
              onChange={setTempSupabaseProjectId}
              style={{ marginTop: '4px' }}
            />
          </div>
          
          <div>
            <Text strong>Service Role Key:</Text>
            <Input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              value={tempSupabaseApiKey}
              onChange={setTempSupabaseApiKey}
              style={{ marginTop: '4px' }}
            />
          </div>
          
          <Text type="tertiary" style={{ fontSize: '12px' }}>
            ⚠️ Use apenas em projetos de desenvolvimento. Nunca use service role key em produção.
            <br />
            🔒 As credenciais são armazenadas localmente e usadas apenas para este projeto.
            <br />
            📍 Obtenha no painel do Supabase: Settings → API → Project ID e Service Role
          </Text>
        </div>
      </Modal>

      {/* Preview Modal for Table Generation */}
      <PreviewModal
        visible={showPreview}
        onCancel={() => setShowPreview(false)}
        onApprove={handleApprovePreview}
        onReject={handleRejectPreview}
        onCreateInSupabase={handleCreateInSupabase}
        isMcpConfigured={isMcpConfigured}
        previewData={previewData}
        loading={creatingTables}
      />
    </>
  );
};

export default ChatPanel;