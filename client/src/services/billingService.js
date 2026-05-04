import api from '../api/axiosInstance';

export const getCurrentPlan = () => api.get('/billing/plan');

export const changePlan = (payload) => api.post('/billing/plan/change', payload);

export const listBillingHistory = (params) => api.get('/billing/history', { params });

export const getInvoice = (invoiceNumber) => api.get(`/billing/invoice/${invoiceNumber}`);
