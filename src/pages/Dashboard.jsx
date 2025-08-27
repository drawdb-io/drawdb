import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Button, 
  Card, 
  Typography, 
  Space, 
  Empty, 
  Spin, 
  Modal, 
  Form, 
  Toast,
  Dropdown,
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
  IconExit,
  IconUserGroup,
  IconHistory
} from '@douyinfe/semi-icons';
import { useProjects } from '../context/ProjectsContext';
import { useAuth } from '../context/AuthContext';
import CollaborationModal from '../components/CollaborationModal';
import VersionHistoryModal from '../components/VersionHistoryModal';

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
    setCurrentProject,
    loadProject
  } = useProjects();
  
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [collaborationModalVisible, setCollaborationModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [versionHistoryModalVisible, setVersionHistoryModalVisible] = useState(false);
  const [selectedProjectForVersions, setSelectedProjectForVersions] = useState(null);
  
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

  const handleEditProject = async (values) => {
    try {
      setEditLoading(true);
      const { error } = await updateProject(editingProject.id, {
        nome: values.nome,
        descricao: values.descricao
      });
      
      if (error) {
        Toast.error('Erro ao atualizar projeto: ' + error.message);
        return;
      }
      
      Toast.success('Projeto atualizado com sucesso!');
      setEditModalVisible(false);
      setEditingProject(null);
    } catch (error) {
      Toast.error('Erro inesperado ao atualizar projeto');
      console.error('Update project error:', error);
    } finally {
      setEditLoading(false);
    }
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setEditModalVisible(true);
  };

  const openCollaborationModal = (project) => {
    setSelectedProject(project);
    setCollaborationModalVisible(true);
  };

  const openVersionHistoryModal = (project) => {
    setSelectedProjectForVersions(project);
    setVersionHistoryModalVisible(true);
  };

  const handleShareProject = (project) => {
    const shareUrl = `${window.location.origin}/editor?project=${project.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Projeto: ${project.nome}`,
        text: project.descricao || 'Diagrama de banco de dados',
        url: shareUrl
      }).catch(() => {
        // Se falhar, copia para clipboard
        copyToClipboard(shareUrl, project.nome);
      });
    } else {
      copyToClipboard(shareUrl, project.nome);
    }
  };

  const copyToClipboard = async (url, projectName) => {
    try {
      await navigator.clipboard.writeText(url);
      Toast.success(`Link do projeto "${projectName}" copiado para a área de transferência!`);
    } catch (error) {
      // Fallback para navegadores que não suportam clipboard
      Toast.info(`Link para compartilhar: ${url}`);
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

  const handleOpenProject = async (project) => {
    try {
      const { error } = await loadProject(project.id);
      if (error) {
        Toast.error('Erro ao carregar projeto: ' + error.message);
        return;
      }
      navigate('/editor');
    } catch (error) {
      Toast.error('Erro inesperado ao carregar projeto');
      console.error('Load project error:', error);
    }
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

  const getProjectActions = (project) => (
    <div style={{ padding: '8px 0' }}>
      <div 
        style={{ 
          padding: '8px 16px', 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onClick={() => openEditModal(project)}
      >
        <IconEdit />
        <span>Editar projeto</span>
      </div>
      <div 
        style={{ 
          padding: '8px 16px', 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onClick={() => handleShareProject(project)}
      >
        <IconSend />
        <span>Compartilhar</span>
      </div>
      <div 
        style={{ 
          padding: '8px 16px', 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onClick={() => openCollaborationModal(project)}
      >
        <IconUserGroup />
        <span>Colaboradores</span>
      </div>
      <div 
        style={{ 
          padding: '8px 16px', 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onClick={() => openVersionHistoryModal(project)}
      >
        <IconHistory />
        <span>Histórico de Versões</span>
      </div>
      <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '4px 0' }} />
      <div 
        style={{ 
          padding: '8px 16px', 
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#dc2626'
        }}
        onClick={() => handleDeleteProject(project.id, project.nome)}
      >
        <IconDelete />
        <span>Excluir projeto</span>
      </div>
    </div>
  );

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

                    <Space>
                      <Button
                        size="small"
                        icon={<IconEdit />}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(project);
                        }}
                      />
                      <Button
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenProject(project);
                        }}
                      >
                        Abrir
                      </Button>
                      <Badge 
                        count={project.dados_diagrama?.tables?.length || 0}
                        type="primary"
                      >
                        <IconServer style={{ color: '#6b7280' }} />
                      </Badge>
                    </Space>
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

      {/* Edit Project Modal */}
      <Modal
        title="Editar Projeto"
        visible={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingProject(null);
        }}
        footer={null}
        width={500}
      >
        {editingProject && (
          <Form
            onSubmit={handleEditProject}
            labelPosition="left"
            labelWidth="100px"
            initValues={{
              nome: editingProject.nome,
              descricao: editingProject.descricao || ''
            }}
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
                onClick={() => {
                  setEditModalVisible(false);
                  setEditingProject(null);
                }}
                disabled={editLoading}
              >
                Cancelar
              </Button>
              <Button 
                theme="solid"
                type="primary"
                htmlType="submit"
                loading={editLoading}
              >
                Salvar Alterações
              </Button>
            </div>
          </Form>
        )}
      </Modal>

      {/* Collaboration Modal */}
      <CollaborationModal
        visible={collaborationModalVisible}
        onCancel={() => {
          setCollaborationModalVisible(false);
          setSelectedProject(null);
        }}
        project={selectedProject}
      />

      {/* Version History Modal */}
      <VersionHistoryModal
        visible={versionHistoryModalVisible}
        onCancel={() => {
          setVersionHistoryModalVisible(false);
          setSelectedProjectForVersions(null);
        }}
        project={selectedProjectForVersions}
      />
    </div>
  );
}