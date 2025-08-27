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
  
  // Extract tables, relationships, and database from diagramData
  const tables = diagramData?.tables || [];
  const relationships = diagramData?.relationships || [];
  const database = diagramData?.database || 'GENERIC';

  // Auto-save with debounce
  const debouncedSave = useCallback(
    debounce(async () => {
      console.log('🚀 debouncedSave called with:', { 
        isAuthenticated, 
        user: user?.email, 
        tablesCount: tables?.length,
        relationshipsCount: relationships?.length,
        currentProject: currentProject?.id 
      });

      if (!isAuthenticated || !user) {
        console.log('User not authenticated, skipping auto-save');
        return;
      }

      try {
        console.log('⏳ Setting save state to SAVING');
        setSaveState(State.SAVING);
        
        const diagramDataToSave = {
          tables: tables || [],
          relationships: relationships || [],
          database: database || 'GENERIC',
          areas: [],
          notes: [],
          types: [],
          enums: []
        };
        console.log('📊 Diagram data to save:', { 
          tablesCount: diagramDataToSave.tables.length,
          relationshipsCount: diagramDataToSave.relationships.length,
          database: diagramDataToSave.database 
        });

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
        console.log('💾 Saving to Supabase, projectId:', projectId);
        const { error } = await saveProjectData(projectId, diagramDataToSave);
        if (error) throw error;

        console.log('✅ Save successful, setting state to SAVED');
        setSaveState(State.SAVED);
        console.log('Auto-save successful');

        // Reset to NONE after 2 seconds
        console.log('⏰ Resetting save state to NONE in 2 seconds');
        setTimeout(() => setSaveState(State.NONE), 2000);

      } catch (error) {
        console.error('Auto-save error:', error);
        setSaveState(State.ERROR);
        setTimeout(() => setSaveState(State.NONE), 3000);
      }
    }, 2000),
    [isAuthenticated, user, currentProject, tables, relationships, database, saveProjectData, createProject, setSaveState]
  );

  // Trigger auto-save when diagram data changes
  useEffect(() => {
    console.log('useAutoSave useEffect triggered:', {
      isAuthenticated,
      tablesLength: tables?.length,
      relationshipsLength: relationships?.length,
      currentProject: currentProject?.id,
      user: user?.email
    });
    
    if (isAuthenticated && (tables?.length > 0 || relationships?.length > 0)) {
      console.log('Diagram changed, triggering auto-save...');
      debouncedSave();
    }
  }, [tables, relationships, database, isAuthenticated, currentProject, debouncedSave]);

  return { debouncedSave };
};