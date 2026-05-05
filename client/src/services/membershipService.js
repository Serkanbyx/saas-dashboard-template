import api from '../api/axiosInstance';

export const listMembers = (params) => api.get('/memberships', { params });

export const getMembersOverview = () => api.get('/memberships/overview');

export const updateMemberRole = (membershipId, payload) => api.patch(`/memberships/${membershipId}`, payload);

export const removeMember = (membershipId) => api.delete(`/memberships/${membershipId}`);

export const leaveOrg = () => api.delete('/memberships/me');

export const transferOwnership = (membershipId, payload) => api.post(`/memberships/${membershipId}/transfer-ownership`, payload);
