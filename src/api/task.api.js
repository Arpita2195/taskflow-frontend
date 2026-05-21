import api from './axios';

export const fetchTasks = (params) => api.get('/tasks', { params });
export const fetchTask = (id) => api.get(`/tasks/${id}`);
export const createTask = (data) => api.post('/tasks', data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);
export const moveTask = (id, data) => api.patch(`/tasks/${id}/move`, data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);
