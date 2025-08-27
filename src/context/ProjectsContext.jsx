import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const ProjectsContext = createContext({});

export const useProjects = () => {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectsProvider');
  }
  return context;
};

export const ProjectsProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projetos')
        .select('*')
        .eq('usuario_id', user.id)
        .order('atualizado_em', { ascending: false });
      
      if (error) throw error;
      setProjects(data || []);
      return { data, error: null };
    } catch (error) {
      console.error('Error loading projects:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (nome, descricao = '') => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projetos')
        .insert({
          nome,
          descricao,
          usuario_id: user.id,
          dados_diagrama: {
            tables: [],
            relationships: [],
            areas: [],
            notes: [],
            types: [],
            enums: []
          }
        })
        .select()
        .single();

      if (error) throw error;
      
      // Add to local state
      setProjects(prev => [data, ...prev]);
      return { data, error: null };
    } catch (error) {
      console.error('Error creating project:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (id, updates) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projetos')
        .update({
          ...updates,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setProjects(prev => 
        prev.map(project => 
          project.id === id ? { ...project, ...data } : project
        )
      );

      // Update current project if it's the one being updated
      if (currentProject?.id === id) {
        setCurrentProject(prev => ({ ...prev, ...data }));
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error updating project:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('projetos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove from local state
      setProjects(prev => prev.filter(project => project.id !== id));
      
      // Clear current project if it's the one being deleted
      if (currentProject?.id === id) {
        setCurrentProject(null);
      }

      return { error: null };
    } catch (error) {
      console.error('Error deleting project:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const loadProject = async (id) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projetos')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setCurrentProject(data);
      return { data, error: null };
    } catch (error) {
      console.error('Error loading project:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const saveProjectData = async (projectId, diagramData) => {
    try {
      const { data, error } = await supabase
        .from('projetos')
        .update({
          dados_diagrama: diagramData,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;

      // NÃO atualizar currentProject aqui para evitar loops
      // O auto-save não deve recarregar os dados que acabou de salvar
      
      return { data, error: null };
    } catch (error) {
      console.error('Error saving project data:', error);
      return { data: null, error };
    }
  };

  // Load projects when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadProjects();
    } else {
      setProjects([]);
      setCurrentProject(null);
    }
  }, [isAuthenticated, user]);

  const value = {
    projects,
    currentProject,
    loading,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    loadProject,
    saveProjectData,
    setCurrentProject,
  };

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
};