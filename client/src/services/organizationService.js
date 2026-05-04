import api from '../api/axiosInstance';

export const createOrg = (payload) => api.post('/organizations', payload);

export const getMyOrgs = () => api.get('/organizations/mine');

export const getOrgById = (orgId) => api.get(`/organizations/${orgId}`);

export const updateOrg = (orgId, payload) => api.patch(`/organizations/${orgId}`, payload);

export const deleteOrg = (orgId, payload) => api.delete(`/organizations/${orgId}`, { data: payload });
