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
  const { tables, relationships } = diagramData || { tables: [], relationships: [] };

  // Auto-save with debounce
  const debouncedSave = useCallback(
    debounce(async () => {
      if (!isAuthenticated || !user) {
        console.log('User not authenticated, skipping auto-save');
        return;
      }

      try {
        setSaveState(State.SAVING);
        
        const diagramData = {
          tables: tables || [],
          relationships: relationships || [],
          areas: [],
          notes: [],
          types: [],
          enums: []
        };

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
        const { error } = await saveProjectData(projectId, diagramData);
        if (error) throw error;

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
    [isAuthenticated, user, currentProject, tables, relationships, saveProjectData, createProject, setSaveState]
  );

  // Trigger auto-save when diagram data changes
  useEffect(() => {
    if (isAuthenticated && (tables?.length > 0 || relationships?.length > 0)) {
      console.log('Diagram changed, triggering auto-save...');
      debouncedSave();
    }
  }, [tables, relationships, isAuthenticated, debouncedSave]);

  return { debouncedSave };
};