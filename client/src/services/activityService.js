import api from '../api/axiosInstance';

export const listActivity = (params) => api.get('/activities', { params });

export const getActivityStats = () => api.get('/activities/stats');
