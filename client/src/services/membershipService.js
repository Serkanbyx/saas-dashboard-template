import api from '../api/axiosInstance';
import { invalidateMyOrgsCache } from './organizationService';

export const listMembers = (params) => api.get('/memberships', { params });

export const getMembersOverview = () => api.get('/memberships/overview');

export const updateMemberRole = async (membershipId, payload) => {
  const response = await api.patch(`/memberships/${membershipId}`, payload);
  invalidateMyOrgsCache();

  return response;
};

export const removeMember = async (membershipId) => {
  const response = await api.delete(`/memberships/${membershipId}`);
  invalidateMyOrgsCache();

  return response;
};

export const leaveOrg = async (orgId) => {
  const response = await api.delete('/memberships/me', orgId ? { headers: { 'x-org-id': orgId } } : undefined);
  invalidateMyOrgsCache();

  return response;
};

export const transferOwnership = async (membershipId, payload) => {
  const response = await api.post(`/memberships/${membershipId}/transfer-ownership`, payload);
  invalidateMyOrgsCache();

  return response;
};
