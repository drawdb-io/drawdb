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

  // Auto-save with debounce - capture data at trigger time
  const debouncedSave = useCallback(
    debounce(async (capturedData) => {
      if (!isAuthenticated || !user) {
        return;
      }

      try {
        setSaveState(State.SAVING);

        let projectId = currentProject?.id;

        // If no current project, create one
        if (!projectId) {
          const { data, error } = await createProject(
            `Diagrama ${new Date().toLocaleDateString()}`,
            'Projeto criado automaticamente'
          );
          
          if (error) throw error;
          projectId = data.id;
        }

        // Save diagram data
        const { error } = await saveProjectData(projectId, capturedData);
        if (error) throw error;

        setSaveState(State.SAVED);

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
      
      // Capture data at trigger time to avoid stale closures during HMR
      const capturedData = {
        tables: diagramData?.tables || [],
        relationships: diagramData?.relationships || [],
        database: diagramData?.database || 'GENERIC',
        areas: [],
        notes: [],
        types: [],
        enums: []
      };
      
      debouncedSave(capturedData);
    }
  }, [diagramData?.tables, diagramData?.relationships, diagramData?.database, isAuthenticated, currentProject, user?.email, debouncedSave]);

  return { debouncedSave };
};