import { create } from 'zustand';
import { fetchProjects, createProject, updateProject, deleteProject } from '../api/project.api';

const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  userRole: null, // 'owner', 'admin', 'member', 'viewer'
  loading: false,
  error: null,

  loadProjects: async (userId, userObj) => {
    set({ loading: true, error: null });
    try {
      const { data } = await fetchProjects();
      const projects = data.projects || [];
      set({ projects, loading: false });
      
      const current = get().currentProject;
      if (projects.length > 0) {
        if (!current) {
          get().setCurrentProject(projects[0], userId, userObj);
        } else {
          // Sync currentProject with fetched data if it exists
          const updated = projects.find(p => p._id === current._id);
          if (updated) {
            get().setCurrentProject(updated, userId, userObj);
          } else {
            get().setCurrentProject(projects[0], userId, userObj);
          }
        }
      } else {
        set({ currentProject: null, userRole: null });
      }
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  setCurrentProject: (project, userOrId, userObj) => {
    // Support both setCurrentProject(project, userId) and setCurrentProject(project, userId, userObj)
    const userId = typeof userOrId === 'string' ? userOrId : userOrId;
    const globalRole = userObj?.role || null;
    let role = null;
    if (project) {
      // Global admin gets owner-level access on every project
      if (globalRole === 'admin') {
        role = 'owner';
      } else if (project.owner === userId || project.owner?._id === userId) {
        role = 'owner';
      } else {
        const member = project.members?.find(m => (m.user?._id || m.user) === userId);
        role = member?.role || 'viewer';
      }
    }
    set({ currentProject: project, userRole: role });
  },

  addProject: async (projectData) => {
    const { data } = await createProject(projectData);
    // Removed manual state update to avoid duplication with socket listener
    // set((state) => ({ projects: [...state.projects, data.project] }));
    return data.project;
  },

  editProject: async (id, updates) => {
    const { data } = await updateProject(id, updates);
    set((state) => ({
      projects: state.projects.map((p) => (p._id === id ? data.project : p)),
      currentProject: state.currentProject?._id === id ? data.project : state.currentProject,
    }));
  },

  removeProject: async (id) => {
    await deleteProject(id);
    set((state) => ({
      projects: state.projects.filter((p) => p._id !== id),
      currentProject: state.currentProject?._id === id ? null : state.currentProject,
    }));
  },

  // Called by socket event
  onProjectCreated: (project) => {
    set((state) => {
      const exists = state.projects.find((p) => p._id === project._id);
      if (exists) return state;
      return { projects: [...state.projects, project] };
    });
  },
}));

export default useProjectStore;
