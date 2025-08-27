import { useEffect, useCallback } from "react";
import { State } from "../data/constants";
import { useProjects } from "../context/ProjectsContext";
import { useAuth } from "../context/AuthContext";
import { useDiagram } from "./index";
import { useSaveState } from "./index";

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export const useAutoSave = () => {
  const { setSaveState } = useSaveState();
  const { currentProject, saveProjectData, createProject } = useProjects();
  const { isAuthenticated, user } = useAuth();
  const diagramData = useDiagram();

  // Auto-save with debounce
  const debouncedSave = useCallback(
    debounce(async () => {
      console.log('🚀 Auto-save started for project:', currentProject?.id || 'local');

      if (!isAuthenticated || !user) {
        console.log('User not authenticated, skipping auto-save');
        return;
      }

      try {
        setSaveState(State.SAVING);
        
        const diagramDataToSave = {
          tables: diagramData?.tables || [],
          relationships: diagramData?.relationships || [],
          database: diagramData?.database || 'GENERIC',
          areas: [],
          notes: [],
          types: [],
          enums: []
        };
        console.log('📊 Saving:', diagramDataToSave.tables.length, 'tables');

        let projectId = currentProject?.id;

        // If no current project, create one
        if (!projectId) {
          console.log('No current project, creating new one...');
          const { data, error } = await createProject(
            `Diagrama ${new Date().toLocaleDateString()}`,
            'Projeto criado automaticamente'
          );
          
          if (error) throw error;
          projectId = data.id;
          console.log('New project created:', projectId);
        }

        // Save diagram data
        const { error } = await saveProjectData(projectId, diagramDataToSave);
        if (error) throw error;

        console.log('✅ Auto-save successful');
        setSaveState(State.SAVED);
        console.log('Auto-save successful');

        // Reset to NONE after 2 seconds
        setTimeout(() => setSaveState(State.NONE), 2000);

      } catch (error) {
        console.error('Auto-save error:', error);
        setSaveState(State.ERROR);
        setTimeout(() => setSaveState(State.NONE), 3000);
      }
    }, 2000),
    [isAuthenticated, user, currentProject, saveProjectData, createProject, setSaveState]
  );

  // Trigger auto-save when diagram data changes
  useEffect(() => {
    if (isAuthenticated && (diagramData?.tables?.length > 0 || diagramData?.relationships?.length > 0)) {
      console.log('Auto-save triggered: tables:', diagramData?.tables?.length, 'relationships:', diagramData?.relationships?.length);
      debouncedSave();
    }
  }, [diagramData?.tables, diagramData?.relationships, diagramData?.database, isAuthenticated, currentProject, user?.email, debouncedSave]);

  return { debouncedSave };
};