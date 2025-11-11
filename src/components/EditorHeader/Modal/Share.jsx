import { Banner, Button, Input, Spin, Toast, Tabs, TabPane } from "@douyinfe/semi-ui";
import { useCallback, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IdContext } from "../../Workspace";
import { IconLink, IconUser, IconMail } from "@douyinfe/semi-icons";
import {
  useAreas,
  useDiagram,
  useEnums,
  useNotes,
  useTransform,
  useTypes,
} from "../../../hooks";
import { databases } from "../../../data/databases";
import { MODAL } from "../../../data/constants";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../context/AuthContext";

export default function Share({ title, setModal }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const { tables, relationships, database } = useDiagram();
  const { notes } = useNotes();
  const { areas } = useAreas();
  const { types } = useTypes();
  const { enums } = useEnums();
  const { transform } = useTransform();
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("link");
  const [shareLinks, setShareLinks] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);

  // Carregar projeto atual baseado no title
  useEffect(() => {
    const loadCurrentProject = async () => {
      if (!title || !user) return;
      
      try {
        const { data, error } = await supabase
          .from('projetos')
          .select('*')
          .eq('nome', title)
          .eq('usuario_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao carregar projeto:', error);
          return;
        }
        
        setCurrentProject(data);
      } catch (error) {
        console.error('Erro ao carregar projeto:', error);
      }
    };

    loadCurrentProject();
  }, [title, user]);

  // Carregar links de compartilhamento
  useEffect(() => {
    const loadShareLinks = async () => {
      if (!currentProject?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('compartilhamentos_projeto')
          .select('*')
          .eq('projeto_id', currentProject.id)
          .order('criado_em', { ascending: false });

        if (error) throw error;
        
        setShareLinks(data || []);
      } catch (error) {
        console.error('Erro ao carregar links:', error);
      }
    };

    loadShareLinks();
  }, [currentProject?.id]);

  // Criar novo link de compartilhamento
  const createShareLink = async () => {
    if (!currentProject?.id || !user) return;
    
    try {
      setLoading(true);
      
      const token = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { data, error } = await supabase
        .from('compartilhamentos_projeto')
        .insert({
          projeto_id: currentProject.id,
          token_compartilhamento: token,
          nivel_permissao: 'visualizar',
          criado_por: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      setShareLinks(prev => [data, ...prev]);
      Toast.success('Link de compartilhamento criado!');
    } catch (error) {
      Toast.error('Erro ao criar link: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Remover link de compartilhamento
  const removeShareLink = async (linkId) => {
    try {
      const { error } = await supabase
        .from('compartilhamentos_projeto')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
      
      setShareLinks(prev => prev.filter(link => link.id !== linkId));
      Toast.success('Link removido!');
    } catch (error) {
      Toast.error('Erro ao remover link: ' + error.message);
    }
  };

  const copyLink = (token) => {
    const url = `${window.location.origin}/shared/${token}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        Toast.success("Link copiado!");
      })
      .catch(() => {
        Toast.error("Erro ao copiar link");
      });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <Banner
          description="Você precisa estar logado para compartilhar projetos."
          type="warning"
          closeIcon={null}
          fullMode={false}
        />
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="text-center py-8">
        <Banner
          description="Projeto não encontrado. Salve o projeto primeiro para poder compartilhá-lo."
          type="warning"
          closeIcon={null}
          fullMode={false}
        />
      </div>
    );
  }

  return (
    <div>
      <Tabs activeKey={activeTab} onChange={setActiveTab} type="line">
        <TabPane tab="Links de Compartilhamento" itemKey="link">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-lg font-semibold">Links Ativos</h4>
                <p className="text-sm text-gray-600">
                  Crie links para permitir visualização do projeto
                </p>
              </div>
              <Button 
                theme="solid" 
                onClick={createShareLink} 
                loading={loading}
                icon={<IconLink />}
              >
                Criar Link
              </Button>
            </div>

            {shareLinks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <IconLink size="large" style={{ marginBottom: '8px' }} />
                <p>Nenhum link de compartilhamento criado</p>
                <p className="text-sm">Crie um link para compartilhar este projeto</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shareLinks.map((link) => (
                  <div key={link.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                          {window.location.origin}/shared/{link.token_compartilhamento}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Criado em {formatDate(link.criado_em)} • Nível: {link.nivel_permissao}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="small" 
                        onClick={() => copyLink(link.token_compartilhamento)}
                        icon={<IconLink />}
                      >
                        Copiar Link
                      </Button>
                      <Button 
                        size="small" 
                        type="danger" 
                        theme="borderless"
                        onClick={() => removeShareLink(link.id)}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabPane>

        <TabPane tab="Colaboradores" itemKey="collaborators">
          <div className="text-center py-8">
            <IconUser size="large" style={{ marginBottom: '8px', color: '#6b7280' }} />
            <p className="text-gray-500">Gerenciamento de colaboradores</p>
            <p className="text-sm text-gray-400 mb-4">
              Vá para o Dashboard para gerenciar colaboradores deste projeto
            </p>
            <Button 
              onClick={() => {
                setModal(MODAL.NONE);
                window.location.href = '/dashboard';
              }}
            >
              Ir para Dashboard
            </Button>
          </div>
        </TabPane>
      </Tabs>
    </div>
  );
}
