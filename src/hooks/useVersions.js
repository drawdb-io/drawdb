import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const useVersions = (projectId) => {
  const { user } = useAuth();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carregar versões do projeto
  const loadVersions = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('versoes_projeto')
        .select(`
          id,
          numero_versao,
          dados_diagrama,
          resumo_alteracoes,
          criado_em,
          criado_por:auth.users!criado_por(
            id,
            email,
            user_metadata
          )
        `)
        .eq('projeto_id', projectId)
        .order('numero_versao', { ascending: false });

      if (error) throw error;

      setVersions(data || []);
    } catch (err) {
      console.error('Erro ao carregar versões:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Criar nova versão
  const createVersion = async (diagramData, summary = '') => {
    if (!projectId || !user) {
      throw new Error('Projeto ou usuário não encontrado');
    }

    try {
      setLoading(true);

      // Buscar o próximo número de versão
      const { data: lastVersion } = await supabase
        .from('versoes_projeto')
        .select('numero_versao')
        .eq('projeto_id', projectId)
        .order('numero_versao', { ascending: false })
        .limit(1)
        .single();

      const nextVersion = (lastVersion?.numero_versao || 0) + 1;

      // Criar nova versão
      const { data, error } = await supabase
        .from('versoes_projeto')
        .insert({
          projeto_id: projectId,
          numero_versao: nextVersion,
          dados_diagrama: diagramData,
          resumo_alteracoes: summary,
          criado_por: user.id
        })
        .select(`
          id,
          numero_versao,
          dados_diagrama,
          resumo_alteracoes,
          criado_em,
          criado_por:auth.users!criado_por(
            id,
            email,
            user_metadata
          )
        `)
        .single();

      if (error) throw error;

      // Atualizar lista local
      setVersions(prev => [data, ...prev]);

      return data;
    } catch (err) {
      console.error('Erro ao criar versão:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Restaurar versão específica
  const restoreVersion = async (versionId) => {
    try {
      setLoading(true);

      // Buscar dados da versão
      const { data: versionData, error: versionError } = await supabase
        .from('versoes_projeto')
        .select('dados_diagrama, numero_versao')
        .eq('id', versionId)
        .single();

      if (versionError) throw versionError;

      // Atualizar projeto principal
      const { error: updateError } = await supabase
        .from('projetos')
        .update({
          dados_diagrama: versionData.dados_diagrama,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', projectId);

      if (updateError) throw updateError;

      return {
        success: true,
        versionNumber: versionData.numero_versao,
        diagramData: versionData.dados_diagrama
      };

    } catch (err) {
      console.error('Erro ao restaurar versão:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Comparar duas versões
  const compareVersions = (version1, version2) => {
    const data1 = version1.dados_diagrama;
    const data2 = version2.dados_diagrama;

    const changes = {
      tables: {
        added: [],
        removed: [],
        modified: []
      },
      relationships: {
        added: [],
        removed: [],
        modified: []
      }
    };

    // Comparar tabelas
    const tables1 = data1.tables || [];
    const tables2 = data2.tables || [];

    // Tabelas adicionadas
    tables2.forEach(table => {
      if (!tables1.find(t => t.id === table.id)) {
        changes.tables.added.push(table);
      }
    });

    // Tabelas removidas
    tables1.forEach(table => {
      if (!tables2.find(t => t.id === table.id)) {
        changes.tables.removed.push(table);
      }
    });

    // Tabelas modificadas
    tables1.forEach(table1 => {
      const table2 = tables2.find(t => t.id === table1.id);
      if (table2) {
        if (JSON.stringify(table1) !== JSON.stringify(table2)) {
          changes.tables.modified.push({
            old: table1,
            new: table2
          });
        }
      }
    });

    // Comparar relacionamentos
    const rels1 = data1.relationships || [];
    const rels2 = data2.relationships || [];

    rels2.forEach(rel => {
      if (!rels1.find(r => r.id === rel.id)) {
        changes.relationships.added.push(rel);
      }
    });

    rels1.forEach(rel => {
      if (!rels2.find(r => r.id === rel.id)) {
        changes.relationships.removed.push(rel);
      }
    });

    return changes;
  };

  // Carregar versões quando o projectId mudar
  useEffect(() => {
    if (projectId) {
      loadVersions();
    }
  }, [projectId]);

  return {
    versions,
    loading,
    error,
    loadVersions,
    createVersion,
    restoreVersion,
    compareVersions
  };
};