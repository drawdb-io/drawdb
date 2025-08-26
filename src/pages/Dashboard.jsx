import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Button, 
  Card, 
  Typography, 
  Space, 
  Empty, 
  Spin, 
  Modal, 
  Form, 
  Input, 
  Toast,
  Dropdown,
  Avatar,
  Badge
} from '@douyinfe/semi-ui';
import { 
  IconPlus, 
  IconEdit, 
  IconDelete, 
  IconSend, 
  IconClock, 
  IconUser,
  IconMore,
  IconServer,
  IconExit
} from '@douyinfe/semi-icons';
import { useProjects } from '../context/ProjectsContext';
import { useAuth } from '../context/AuthContext';

const { Title, Paragraph, Text } = Typography;

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { 
    projects, 
    loading, 
    createProject, 
    deleteProject, 
    updateProject,
    setCurrentProject 
  } = useProjects();
  
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  
  const handleCreateProject = async (values) => {
    try {
      setCreateLoading(true);
      const { data, error } = await createProject(values.nome, values.descricao);
      
      if (error) {
        Toast.error('Erro ao criar projeto: ' + error.message);
        return;
      }
      
      Toast.success('Projeto criado com sucesso!');
      setCreateModalVisible(false);
      setCurrentProject(data);
      navigate('/editor');
    } catch (error) {
      Toast.error('Erro inesperado ao criar projeto');
      console.error('Create project error:', error);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteProject = async (projectId, projectName) => {
    Modal.confirm({
      title: 'Confirmar exclusão',
      content: `Tem certeza que deseja excluir o projeto "${projectName}"? Esta ação não pode ser desfeita.`,
      okText: 'Excluir',
      cancelText: 'Cancelar',
      type: 'danger',
      onOk: async () => {
        const { error } = await deleteProject(projectId);
        if (error) {
          Toast.error('Erro ao excluir projeto: ' + error.message);
        } else {
          Toast.success('Projeto excluído com sucesso!');
        }
      }
    });
  };

  const handleOpenProject = (project) => {
    setCurrentProject(project);
    navigate('/editor');
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      Toast.error('Erro ao fazer logout');
    } else {
      navigate('/');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProjectActions = (project) => [
    {
      node: 'item',
      name: 'edit',
      text: 'Editar projeto',
      icon: <IconEdit />,
      onClick: () => {
        // TODO: Implement edit project modal
        Toast.info('Funcionalidade em desenvolvimento');
      }
    },
    {
      node: 'item',
      name: 'share',
      text: 'Compartilhar',
      icon: <IconSend />,
      onClick: () => {
        // TODO: Implement share project
        Toast.info('Funcionalidade em desenvolvimento');
      }
    },
    {
      node: 'divider'
    },
    {
      node: 'item',
      name: 'delete',
      text: 'Excluir projeto',
      icon: <IconDelete />,
      type: 'danger',
      onClick: () => handleDeleteProject(project.id, project.nome)
    }
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px',
        color: 'white'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={2} style={{ color: 'white', margin: 0 }}>
                🚀 SchemaFlow
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                Bem-vindo(a), {user?.user_metadata?.full_name || user?.email}!
              </Text>
            </div>
            
            <Space>
              <Button 
                theme="borderless" 
                type="primary"
                icon={<IconUser />}
                style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
              >
                Perfil
              </Button>
              <Button 
                theme="borderless" 
                type="primary"
                icon={<IconExit />}
                onClick={handleSignOut}
                style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
              >
                Sair
              </Button>
            </Space>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
        {/* Actions Bar */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '32px'
        }}>
          <div>
            <Title level={3} style={{ margin: 0, color: '#1f2937' }}>
              Meus Projetos
            </Title>
            <Text type="tertiary">
              {projects.length} projeto{projects.length !== 1 ? 's' : ''} encontrado{projects.length !== 1 ? 's' : ''}
            </Text>
          </div>
          
          <Button 
            theme="solid"
            type="primary"
            icon={<IconPlus />}
            onClick={() => setCreateModalVisible(true)}
            size="large"
          >
            Novo Projeto
          </Button>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px' }}>
            <Spin size="large" />
            <Paragraph style={{ marginTop: '16px', color: '#6b7280' }}>
              Carregando projetos...
            </Paragraph>
          </div>
        ) : projects.length === 0 ? (
          <Empty
            image={<IconServer size="extra-large" style={{ color: '#d1d5db' }} />}
            title="Nenhum projeto encontrado"
            description="Crie seu primeiro projeto para começar a desenhar diagramas de banco de dados"
            style={{ padding: '80px' }}
          >
            <Button 
              theme="solid"
              type="primary"
              icon={<IconPlus />}
              onClick={() => setCreateModalVisible(true)}
            >
              Criar Primeiro Projeto
            </Button>
          </Empty>
        ) : (
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {projects.map((project) => (
              <Card
                key={project.id}
                style={{ 
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                bodyStyle={{ padding: '24px' }}
                hoverable
                onClick={() => handleOpenProject(project)}
                headerExtraContent={
                  <Dropdown
                    trigger="click"
                    content={getProjectActions(project)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      icon={<IconMore />}
                      theme="borderless"
                      size="small"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Dropdown>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Title level={4} style={{ margin: 0, color: '#1f2937' }}>
                      {project.nome}
                    </Title>
                    {project.descricao && (
                      <Paragraph 
                        style={{ 
                          margin: '8px 0 0 0', 
                          color: '#6b7280',
                          fontSize: '14px'
                        }}
                        ellipsis={{ rows: 2 }}
                      >
                        {project.descricao}
                      </Paragraph>
                    )}
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '16px',
                    borderTop: '1px solid #f3f4f6'
                  }}>
                    <Space size="small">
                      <IconClock size="small" style={{ color: '#9ca3af' }} />
                      <Text type="tertiary" size="small">
                        {formatDate(project.atualizado_em || project.criado_em)}
                      </Text>
                    </Space>

                    <Badge 
                      count={project.dados_diagrama?.tables?.length || 0}
                      type="primary"
                    >
                      <IconServer style={{ color: '#6b7280' }} />
                    </Badge>
                  </div>
                </Space>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <Modal
        title="Criar Novo Projeto"
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          onSubmit={handleCreateProject}
          labelPosition="left"
          labelWidth="100px"
        >
          <Form.Input
            field="nome"
            label="Nome"
            placeholder="Nome do projeto"
            rules={[
              { required: true, message: 'Nome é obrigatório' },
              { min: 2, message: 'Nome deve ter pelo menos 2 caracteres' }
            ]}
            style={{ marginBottom: '16px' }}
          />
          
          <Form.TextArea
            field="descricao"
            label="Descrição"
            placeholder="Descrição opcional do projeto"
            rows={3}
            style={{ marginBottom: '24px' }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button 
              onClick={() => setCreateModalVisible(false)}
              disabled={createLoading}
            >
              Cancelar
            </Button>
            <Button 
              theme="solid"
              type="primary"
              htmlType="submit"
              loading={createLoading}
            >
              Criar Projeto
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}