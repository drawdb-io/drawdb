import { useState, useEffect, useCallback, useRef } from 'react';
import { useVersions } from './useVersions';
import { useProjects } from '../context/ProjectsContext';
import { useAuth } from '../context/AuthContext';

// Configurações do versionamento automático
const AUTO_VERSION_CONFIG = {
  // Criar versão automática a cada 30 minutos de atividade
  TIME_INTERVAL: 30 * 60 * 1000, // 30 minutos em ms
  
  // Criar versão automática após X mudanças significativas
  SIGNIFICANT_CHANGES_THRESHOLD: 10,
  
  // Tipos de mudanças consideradas significativas
  SIGNIFICANT_CHANGE_TYPES: [
    'table_added',
    'table_removed',
    'relationship_added',
    'relationship_removed',
    'field_added',
    'field_removed'
  ]
};

export const useAutoVersioning = (projectId) => {
  const { user } = useAuth();
  const { currentProject } = useProjects();
  const { createVersion } = useVersions(projectId);
  
  const [significantChangesCount, setSignificantChangesCount] = useState(0);
  const [lastAutoVersion, setLastAutoVersion] = useState(null);
  const [isCreatingAutoVersion, setIsCreatingAutoVersion] = useState(false);
  
  const lastDiagramSnapshot = useRef(null);
  const activityTimer = useRef(null);
  const lastActivity = useRef(Date.now());

  // Detectar mudanças significativas no diagrama
  const detectSignificantChanges = useCallback((newData, oldData) => {
    if (!oldData || !newData) return [];

    const changes = [];
    
    // Comparar tabelas
    const oldTables = oldData.tables || [];
    const newTables = newData.tables || [];
    
    // Tabelas adicionadas
    newTables.forEach(table => {
      if (!oldTables.find(t => t.id === table.id)) {
        changes.push({
          type: 'table_added',
          description: `Tabela "${table.name}" adicionada`
        });
      }
    });

    // Tabelas removidas
    oldTables.forEach(table => {
      if (!newTables.find(t => t.id === table.id)) {
        changes.push({
          type: 'table_removed',
          description: `Tabela "${table.name}" removida`
        });
      }
    });

    // Campos adicionados/removidos
    newTables.forEach(newTable => {
      const oldTable = oldTables.find(t => t.id === newTable.id);
      if (oldTable) {
        const oldFields = oldTable.fields || [];
        const newFields = newTable.fields || [];
        
        newFields.forEach(field => {
          if (!oldFields.find(f => f.id === field.id)) {
            changes.push({
              type: 'field_added',
              description: `Campo "${field.name}" adicionado à tabela "${newTable.name}"`
            });
          }
        });
        
        oldFields.forEach(field => {
          if (!newFields.find(f => f.id === field.id)) {
            changes.push({
              type: 'field_removed',
              description: `Campo "${field.name}" removido da tabela "${newTable.name}"`
            });
          }
        });
      }
    });

    // Comparar relacionamentos
    const oldRels = oldData.relationships || [];
    const newRels = newData.relationships || [];
    
    newRels.forEach(rel => {
      if (!oldRels.find(r => r.id === rel.id)) {
        changes.push({
          type: 'relationship_added',
          description: `Relacionamento entre "${rel.startTableName}" e "${rel.endTableName}" adicionado`
        });
      }
    });

    oldRels.forEach(rel => {
      if (!newRels.find(r => r.id === rel.id)) {
        changes.push({
          type: 'relationship_removed',
          description: `Relacionamento entre "${rel.startTableName}" e "${rel.endTableName}" removido`
        });
      }
    });

    return changes.filter(change => 
      AUTO_VERSION_CONFIG.SIGNIFICANT_CHANGE_TYPES.includes(change.type)
    );
  }, []);

  // Criar versão automática
  const createAutoVersion = useCallback(async (reason, changes = []) => {
    if (!projectId || !currentProject || isCreatingAutoVersion) return;

    try {
      setIsCreatingAutoVersion(true);

      const summary = `[Auto] ${reason}\n\nMudanças detectadas:\n${
        changes.map(c => `• ${c.description}`).join('\n')
      }`.trim();

      await createVersion(currentProject.dados_diagrama, summary);
      
      setLastAutoVersion(Date.now());
      setSignificantChangesCount(0);
      
      console.log(`✅ Versão automática criada: ${reason}`);
      
    } catch (error) {
      console.error('Erro ao criar versão automática:', error);
    } finally {
      setIsCreatingAutoVersion(false);
    }
  }, [projectId, currentProject, createVersion, isCreatingAutoVersion]);

  // Monitorar atividade e criar versões por tempo
  const resetActivityTimer = useCallback(() => {
    if (activityTimer.current) {
      clearTimeout(activityTimer.current);
    }

    lastActivity.current = Date.now();
    
    activityTimer.current = setTimeout(() => {
      const timeSinceLastVersion = Date.now() - (lastAutoVersion || 0);
      
      if (timeSinceLastVersion >= AUTO_VERSION_CONFIG.TIME_INTERVAL) {
        createAutoVersion('Checkpoint automático após período de atividade');
      }
    }, AUTO_VERSION_CONFIG.TIME_INTERVAL);
  }, [lastAutoVersion, createAutoVersion]);

  // Monitorar mudanças no diagrama
  const handleDiagramChange = useCallback((diagramData) => {
    if (!diagramData || !projectId) return;

    // Detectar mudanças significativas
    const significantChanges = detectSignificantChanges(
      diagramData, 
      lastDiagramSnapshot.current
    );

    if (significantChanges.length > 0) {
      const newCount = significantChangesCount + significantChanges.length;
      setSignificantChangesCount(newCount);

      // Criar versão se atingir o threshold
      if (newCount >= AUTO_VERSION_CONFIG.SIGNIFICANT_CHANGES_THRESHOLD) {
        createAutoVersion(
          `${newCount} mudanças significativas acumuladas`,
          significantChanges
        );
      }
    }

    // Atualizar snapshot
    lastDiagramSnapshot.current = JSON.parse(JSON.stringify(diagramData));
    
    // Resetar timer de atividade
    resetActivityTimer();
  }, [
    projectId, 
    significantChangesCount, 
    detectSignificantChanges, 
    createAutoVersion, 
    resetActivityTimer
  ]);

  // Criar versão manual com contexto automático
  const createManualVersion = useCallback(async (summary) => {
    if (!projectId || !currentProject) return;

    try {
      await createVersion(currentProject.dados_diagrama, summary);
      
      // Reset counters após versão manual
      setSignificantChangesCount(0);
      setLastAutoVersion(Date.now());
      
      return true;
    } catch (error) {
      console.error('Erro ao criar versão manual:', error);
      return false;
    }
  }, [projectId, currentProject, createVersion]);

  // Limpar timers ao desmontar
  useEffect(() => {
    return () => {
      if (activityTimer.current) {
        clearTimeout(activityTimer.current);
      }
    };
  }, []);

  return {
    // Estado
    significantChangesCount,
    lastAutoVersion,
    isCreatingAutoVersion,
    
    // Ações
    handleDiagramChange,
    createManualVersion,
    createAutoVersion,
    
    // Configuração
    config: AUTO_VERSION_CONFIG
  };
};