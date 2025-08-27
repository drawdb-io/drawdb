import React, { useState } from 'react';
import {
  Modal,
  Typography,
  Button,
  List,
  Space,
  Tag,
  Empty,
  Spin,
  Toast,
  Popconfirm,
  Card,
  Divider,
  Input,
  Form
} from '@douyinfe/semi-ui';
import {
  IconHistory,
  IconRefresh,
  IconEyeOpened,
  IconPlus,
  IconClock,
  IconUser,
  IconShield,
  IconSave
} from '@douyinfe/semi-icons';
import { useVersions } from '../hooks/useVersions';
import { useDiagram } from '../hooks';

const { Title, Text, Paragraph } = Typography;

const VersionHistoryModal = ({ visible, onCancel, project }) => {
  const { tables, relationships } = useDiagram();
  const {
    versions,
    loading,
    createVersion,
    restoreVersion,
    compareVersions
  } = useVersions(project?.id);

  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedVersions, setSelectedVersions] = useState([]);

  // Criar nova versão
  const handleCreateVersion = async (values) => {
    try {
      setCreating(true);
      
      const currentDiagramData = {
        tables,
        relationships,
        // Adicionar outros dados do diagrama conforme necessário
      };

      await createVersion(currentDiagramData, values.summary);
      
      Toast.success('Versão criada com sucesso!');
      setShowCreateForm(false);
    } catch (error) {
      Toast.error('Erro ao criar versão: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  // Restaurar versão
  const handleRestoreVersion = async (versionId, versionNumber) => {
    try {
      setRestoring(true);
      
      const result = await restoreVersion(versionId);
      
      Toast.success(`Projeto restaurado para versão ${versionNumber}`);
      
      // Recarregar a página para refletir as mudanças
      window.location.reload();
    } catch (error) {
      Toast.error('Erro ao restaurar versão: ' + error.message);
    } finally {
      setRestoring(false);
    }
  };

  // Alternar seleção de versões para comparação
  const toggleVersionSelection = (versionId) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      } else if (prev.length < 2) {
        return [...prev, versionId];
      } else {
        // Substituir a primeira seleção
        return [prev[1], versionId];
      }
    });
  };

  // Comparar versões selecionadas
  const handleCompareVersions = () => {
    if (selectedVersions.length !== 2) return;

    const version1 = versions.find(v => v.id === selectedVersions[0]);
    const version2 = versions.find(v => v.id === selectedVersions[1]);

    const changes = compareVersions(version1, version2);
    
    // Aqui você pode mostrar um modal de comparação detalhada
    console.log('Changes:', changes);
    Toast.info('Comparação de versões em desenvolvimento');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getUserDisplayName = (user) => {
    return user?.user_metadata?.full_name || user?.email || 'Usuário';
  };

  const renderVersionItem = (version) => {
    const isSelected = selectedVersions.includes(version.id);
    
    return (
      <List.Item
        key={version.id}
        style={{
          border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
          borderRadius: '8px',
          marginBottom: '12px',
          padding: '16px',
          backgroundColor: isSelected ? '#eff6ff' : 'white',
          cursor: compareMode ? 'pointer' : 'default'
        }}
        onClick={() => compareMode && toggleVersionSelection(version.id)}
      >
        <div style={{ width: '100%' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: '12px'
          }}>
            <div>
              <Space>
                <Tag 
                  color="blue" 
                  size="large"
                  style={{ fontWeight: 'bold' }}
                >
                  v{version.numero_versao}
                </Tag>
                {compareMode && isSelected && (
                  <Tag color="green" size="small">Selecionada</Tag>
                )}
              </Space>
              
              <div style={{ marginTop: '8px' }}>
                <Space size="small">
                  <IconUser size="small" style={{ color: '#6b7280' }} />
                  <Text type="tertiary" size="small">
                    {getUserDisplayName(version.criado_por)}
                  </Text>
                  <IconClock size="small" style={{ color: '#6b7280' }} />
                  <Text type="tertiary" size="small">
                    {formatDate(version.criado_em)}
                  </Text>
                </Space>
              </div>
            </div>

            {!compareMode && (
              <Space>
                <Button
                  size="small"
                  icon={<IconEyeOpened />}
                  theme="borderless"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Implementar preview da versão
                    Toast.info('Preview em desenvolvimento');
                  }}
                >
                  Visualizar
                </Button>
                
                <Popconfirm
                  title="Restaurar esta versão?"
                  content="Esta ação irá substituir o estado atual do projeto. Recomendamos criar uma versão antes de restaurar."
                  onConfirm={() => handleRestoreVersion(version.id, version.numero_versao)}
                  okText="Restaurar"
                  cancelText="Cancelar"
                >
                  <Button
                    size="small"
                    icon={<IconRefresh />}
                    type="primary"
                    theme="outline"
                    loading={restoring}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Restaurar
                  </Button>
                </Popconfirm>
              </Space>
            )}
          </div>

          {version.resumo_alteracoes && (
            <div style={{
              backgroundColor: compareMode ? 'rgba(255,255,255,0.7)' : '#f8fafc',
              padding: '12px',
              borderRadius: '6px',
              borderLeft: '3px solid #3b82f6'
            }}>
              <Text style={{ color: '#374151', lineHeight: 1.5 }}>
                {version.resumo_alteracoes}
              </Text>
            </div>
          )}
        </div>
      </List.Item>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <IconHistory />
          <span>Histórico de Versões - {project?.nome}</span>
        </Space>
      }
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      style={{ maxWidth: '90vw' }}
    >
      <div style={{ marginBottom: '24px' }}>
        {/* Header Actions */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {compareMode ? 'Selecione 2 versões para comparar' : 'Versões do Projeto'}
            </Title>
            <Text type="tertiary">
              {compareMode 
                ? `${selectedVersions.length}/2 versões selecionadas`
                : `${versions.length} versão${versions.length !== 1 ? 'ões' : ''} encontrada${versions.length !== 1 ? 's' : ''}`
              }
            </Text>
          </div>
          
          <Space>
            {compareMode ? (
              <>
                <Button
                  onClick={() => {
                    setCompareMode(false);
                    setSelectedVersions([]);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="primary"
                  icon={<IconShield />}
                  disabled={selectedVersions.length !== 2}
                  onClick={handleCompareVersions}
                >
                  Comparar
                </Button>
              </>
            ) : (
              <>
                <Button
                  theme="outline"
                  icon={<IconShield />}
                  onClick={() => setCompareMode(true)}
                  disabled={versions.length < 2}
                >
                  Comparar Versões
                </Button>
                <Button
                  type="primary"
                  icon={<IconPlus />}
                  onClick={() => setShowCreateForm(true)}
                >
                  Nova Versão
                </Button>
              </>
            )}
          </Space>
        </div>

        {/* Create Version Form */}
        {showCreateForm && (
          <Card style={{ marginBottom: '24px', backgroundColor: '#f8fafc' }}>
            <Title level={5} style={{ marginBottom: '16px' }}>
              <IconSave style={{ marginRight: '8px' }} />
              Criar Nova Versão
            </Title>
            
            <Form
              onSubmit={handleCreateVersion}
              style={{ marginBottom: 0 }}
            >
              <Form.TextArea
                field="summary"
                label="Resumo das Alterações"
                placeholder="Descreva as principais mudanças nesta versão..."
                rules={[
                  { required: true, message: 'Resumo é obrigatório' },
                  { min: 10, message: 'Resumo deve ter pelo menos 10 caracteres' }
                ]}
                rows={3}
                style={{ marginBottom: '16px' }}
              />
              
              <Space>
                <Button
                  onClick={() => setShowCreateForm(false)}
                  disabled={creating}
                >
                  Cancelar
                </Button>
                <Button
                  theme="solid"
                  type="primary"
                  htmlType="submit"
                  loading={creating}
                  icon={<IconSave />}
                >
                  Criar Versão
                </Button>
              </Space>
            </Form>
          </Card>
        )}

        {/* Versions List */}
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spin size="large" />
              <Paragraph style={{ marginTop: '16px', color: '#6b7280' }}>
                Carregando histórico de versões...
              </Paragraph>
            </div>
          ) : versions.length === 0 ? (
            <Empty
              image={<IconHistory size="extra-large" style={{ color: '#d1d5db' }} />}
              title="Nenhuma versão encontrada"
              description="Crie sua primeira versão para começar o controle de histórico"
            />
          ) : (
            <List
              dataSource={versions}
              renderItem={renderVersionItem}
              split={false}
            />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default VersionHistoryModal;