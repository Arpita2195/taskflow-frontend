import api from './axios';

export const fetchProjects = () => api.get('/projects');
export const fetchProject = (id) => api.get(`/projects/${id}`);
export const createProject = (data) => api.post('/projects', data);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
export const inviteMember = (id, data) => api.post(`/projects/${id}/invite`, data);
export const updateMemberRole = (projectId, userId, role) => api.put(`/projects/${projectId}/members/${userId}`, { role });
export const removeMember = (projectId, userId) => api.delete(`/projects/${projectId}/members/${userId}`);
export const fetchProjectJoinInfo = (id) => api.get(`/projects/${id}/join-info`);
export const joinProject = (id) => api.post(`/projects/${id}/join`);
export const cancelInvite = (projectId, email) => api.delete(`/projects/${projectId}/invite/${email}`);
