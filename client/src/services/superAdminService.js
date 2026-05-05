import api from '../api/axiosInstance';

export const getPlatformStats = () => api.get('/super-admin/stats');

export const listAllOrgs = (params) => api.get('/super-admin/orgs', { params });

export const getOrgDetails = (orgId) => api.get(`/super-admin/orgs/${orgId}`);

export const suspendOrg = (orgId, payload) => api.patch(`/super-admin/orgs/${orgId}/suspend`, payload);

export const restoreOrg = (orgId) => api.patch(`/super-admin/orgs/${orgId}/restore`);

export const forceDeleteOrg = (orgId, payload) => api.delete(`/super-admin/orgs/${orgId}`, { data: payload });

export const listAllUsers = (params) => api.get('/super-admin/users', { params });

export const getUserMemberships = (userId) => api.get(`/super-admin/users/${userId}/memberships`);

export const updateUserStatus = (userId, payload) => api.patch(`/super-admin/users/${userId}`, payload);
