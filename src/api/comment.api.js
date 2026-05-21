import api from './axios';

export const fetchComments = (taskId) => api.get('/comments', { params: { task: taskId } });
export const addComment = (data) => api.post('/comments', data);
export const deleteComment = (id) => api.delete(`/comments/${id}`);
