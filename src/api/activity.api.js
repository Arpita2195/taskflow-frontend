import api from './axios';

export const fetchActivities = (params) => api.get('/activities', { params });
