import api from '../api/axiosInstance';

export const getOverview = () => api.get('/dashboard/overview');

export const getActivityChart = () => api.get('/dashboard/charts/activity');

export const getGrowthChart = () => api.get('/dashboard/charts/growth');

export const getRevenueChart = () => api.get('/dashboard/charts/revenue');
