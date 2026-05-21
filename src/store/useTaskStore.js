import { create } from 'zustand';
import { fetchTasks, createTask, updateTask, moveTask, deleteTask } from '../api/task.api';

const useTaskStore = create((set, get) => ({
  tasks: [],
  loading: false,
  error: null,

  loadTasks: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await fetchTasks({ project: projectId });
      set({ tasks: data.tasks, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  loadAllTasks: async (projectIds) => {
    set({ loading: true, error: null });
    try {
      const responses = await Promise.all(projectIds.map(id => fetchTasks({ project: id })));
      const allTasks = responses.flatMap(res => res.data.tasks);
      set({ tasks: allTasks, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  addTask: async (taskData) => {
    const { data } = await createTask(taskData);
    // Remove manual state update here to prevent duplicates with socket listener
    // set((state) => ({ tasks: [...state.tasks, data.task] }));
    return data.task;
  },

  editTask: async (id, updates) => {
    const { data } = await updateTask(id, updates);
    set((state) => ({ tasks: state.tasks.map((t) => (t._id === id ? data.task : t)) }));
    return data.task;
  },

  relocateTask: async (id, column, order) => {
    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) => (t._id === id ? { ...t, column, order } : t)),
    }));
    try {
      await moveTask(id, { column, order });
    } catch (_) {
      get().loadTasks(); // Rollback
    }
  },

  removeTask: async (id) => {
    await deleteTask(id);
    set((state) => ({ tasks: state.tasks.filter((t) => t._id !== id) }));
  },

  // Socket handlers
  onTaskCreated: (task) => {
    set((state) => {
      if (state.tasks.find((t) => t._id === task._id)) return state;
      return { tasks: [...state.tasks, task] };
    });
  },

  onTaskUpdated: (task) => {
    set((state) => ({ tasks: state.tasks.map((t) => (t._id === task._id ? task : t)) }));
  },

  onTaskMoved: ({ taskId, column, order }) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t._id === taskId ? { ...t, column, order } : t)),
    }));
  },

  onTaskDeleted: ({ taskId }) => {
    set((state) => ({ tasks: state.tasks.filter((t) => t._id !== taskId) }));
  },

  getByColumn: (column) => get().tasks.filter((t) => t.column === column),
}));

export default useTaskStore;
