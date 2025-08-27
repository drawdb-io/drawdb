import React, { useState, useEffect } from 'react';
import {
  Modal,
  Typography,
  Button,
  Input,
  Select,
  List,
  Avatar,
  Tag,
  Space,
  Toast,
  Popconfirm,
  Empty
} from '@douyinfe/semi-ui';
import {
  IconPlus,
  IconDelete,
  IconMail,
  IconUser,
  IconEyeOpened,
  IconEdit,
  IconSetting
} from '@douyinfe/semi-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const PAPEL_OPTIONS = [
  { value: 'visualizador', label: 'Visualizador', icon: <IconEyeOpened />, color: 'blue' },
  { value: 'editor', label: 'Editor', icon: <IconEdit />, color: 'green' },
  { value: 'administrador', label: 'Administrador', icon: <IconSetting />, color: 'red' }
];

const CollaborationModal = ({ visible, onCancel, project }) => {
  const { user } = useAuth();
  const [colaboradores, setColaboradores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('visualizador');
  const [sendingInvite, setSendingInvite] = useState(false);

  // Carregar colaboradores do projeto
  const loadColaboradores = async () => {
    if (!project?.id) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('colaboradores_projeto')
        .select(`
          id,
          papel,
          criado_em,
          usuario:auth.users!usuario_id (
            id,
            email,
            user_metadata
          ),
          convidado_por:auth.users!convidado_por (
            email,
            user_metadata
          )
        `)
        .eq('projeto_id', project.id)
        .order('criado_em', { ascending: false });

      if (error) throw error;
      
      setColaboradores(data || []);
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
      Toast.error('Erro ao carregar colaboradores');
    } finally {
      setLoading(false);
    }
  };

  // Enviar convite
  const handleSendInvite = async () => {
    if (!inviteEmail.trim() || !project?.id) return;

    try {
      setSendingInvite(true);

      // Verificar se o usuário existe
      const { data: userData, error: userError } = await supabase
        .from('auth.users')
        .select('id, email')
        .eq('email', inviteEmail.toLowerCase().trim())
        .single();

      if (userError || !userData) {
        Toast.error('Usuário não encontrado. Verifique se o email está correto.');
        return;
      }

      // Verificar se já é colaborador
      const { data: existingCollab } = await supabase
        .from('colaboradores_projeto')
        .select('id')
        .eq('projeto_id', project.id)
        .eq('usuario_id', userData.id)
        .single();

      if (existingCollab) {
        Toast.warning('Este usuário já é colaborador do projeto.');
        return;
      }

      // Adicionar colaborador
      const { error: insertError } = await supabase
        .from('colaboradores_projeto')
        .insert({
          projeto_id: project.id,
          usuario_id: userData.id,
          papel: inviteRole,
          convidado_por: user.id
        });

      if (insertError) throw insertError;

      Toast.success(`Convite enviado para ${inviteEmail}!`);
      setInviteEmail('');
      setInviteRole('visualizador');
      loadColaboradores(); // Recarregar lista

    } catch (error) {
      console.error('Erro ao enviar convite:', error);
      Toast.error('Erro ao enviar convite: ' + error.message);
    } finally {
      setSendingInvite(false);
    }
  };

  // Remover colaborador
  const handleRemoveColaborador = async (colaboradorId) => {
    try {
      const { error } = await supabase
        .from('colaboradores_projeto')
        .delete()
        .eq('id', colaboradorId);

      if (error) throw error;

      Toast.success('Colaborador removido com sucesso!');
      loadColaboradores(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao remover colaborador:', error);
      Toast.error('Erro ao remover colaborador: ' + error.message);
    }
  };

  // Alterar papel do colaborador
  const handleChangeRole = async (colaboradorId, newRole) => {
    try {
      const { error } = await supabase
        .from('colaboradores_projeto')
        .update({ papel: newRole })
        .eq('id', colaboradorId);

      if (error) throw error;

      Toast.success('Papel alterado com sucesso!');
      loadColaboradores(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao alterar papel:', error);
      Toast.error('Erro ao alterar papel: ' + error.message);
    }
  };

  const getRoleConfig = (papel) => {
    return PAPEL_OPTIONS.find(opt => opt.value === papel) || PAPEL_OPTIONS[0];
  };

  const getUserDisplayName = (usuario) => {
    return usuario?.user_metadata?.full_name || usuario?.email || 'Usuário';
  };

  // Carregar colaboradores quando o modal abre
  useEffect(() => {
    if (visible && project?.id) {
      loadColaboradores();
    }
  }, [visible, project?.id]);

  return (
    <Modal
      title={`Colaboradores - ${project?.nome || 'Projeto'}`}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
      style={{ maxWidth: '90vw' }}
    >
      <div style={{ marginBottom: '24px' }}>
        {/* Seção de convite */}
        <Title level={4}>Convidar Colaborador</Title>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <Input
            prefix={<IconMail />}
            placeholder="Email do colaborador"
            value={inviteEmail}
            onChange={setInviteEmail}
            style={{ flex: 1 }}
          />
          <Select
            value={inviteRole}
            onChange={setInviteRole}
            style={{ width: '150px' }}
            optionList={PAPEL_OPTIONS.map(opt => ({
              ...opt,
              label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {opt.icon}
                  {opt.label}
                </div>
              )
            }))}
          />
          <Button
            type="primary"
            icon={<IconPlus />}
            onClick={handleSendInvite}
            loading={sendingInvite}
            disabled={!inviteEmail.trim()}
          >
            Convidar
          </Button>
        </div>

        {/* Lista de colaboradores */}
        <Title level={4}>Colaboradores Atuais ({colaboradores.length})</Title>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Text>Carregando colaboradores...</Text>
          </div>
        ) : colaboradores.length === 0 ? (
          <Empty
            image={<IconUser size="extra-large" style={{ color: '#d1d5db' }} />}
            title="Nenhum colaborador"
            description="Convide pessoas para colaborar neste projeto"
          />
        ) : (
          <List
            dataSource={colaboradores}
            renderItem={(colaborador) => {
              const roleConfig = getRoleConfig(colaborador.papel);
              const isOwner = colaborador.usuario?.id === user?.id;
              
              return (
                <List.Item
                  style={{ 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Avatar size="small">
                        {getUserDisplayName(colaborador.usuario).charAt(0).toUpperCase()}
                      </Avatar>
                      <div>
                        <Text strong>{getUserDisplayName(colaborador.usuario)}</Text>
                        <br />
                        <Text type="tertiary" size="small">
                          {colaborador.usuario?.email}
                        </Text>
                        {colaborador.convidado_por && (
                          <>
                            <br />
                            <Text type="tertiary" size="small">
                              Convidado por {colaborador.convidado_por.user_metadata?.full_name || colaborador.convidado_por.email}
                            </Text>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <Space>
                      <Select
                        value={colaborador.papel}
                        onChange={(newRole) => handleChangeRole(colaborador.id, newRole)}
                        size="small"
                        disabled={isOwner}
                        style={{ width: '140px' }}
                        optionList={PAPEL_OPTIONS.map(opt => ({
                          ...opt,
                          label: (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {opt.icon}
                              {opt.label}
                            </div>
                          )
                        }))}
                        renderSelectedItem={(option) => (
                          <Tag color={option.color} size="small">
                            {option.icon}
                            {option.label}
                          </Tag>
                        )}
                      />
                      
                      {!isOwner && (
                        <Popconfirm
                          title="Remover colaborador?"
                          content="Esta ação não pode ser desfeita."
                          onConfirm={() => handleRemoveColaborador(colaborador.id)}
                          okText="Remover"
                          cancelText="Cancelar"
                        >
                          <Button
                            type="danger"
                            theme="borderless"
                            icon={<IconDelete />}
                            size="small"
                          />
                        </Popconfirm>
                      )}
                    </Space>
                  </div>
                </List.Item>
              );
            }}
          />
        )}
      </div>
    </Modal>
  );
};

export default CollaborationModal;