import api from '../api/axiosInstance';

export const createInvitation = (payload) => api.post('/invitations', payload);

export const listInvitations = (params) => api.get('/invitations', { params });

export const revokeInvitation = (invitationId) => api.delete(`/invitations/${invitationId}`);

export const resendInvitation = (invitationId) => api.post(`/invitations/${invitationId}/resend`);

export const getInvitationByToken = (token) => api.get(`/invitations/by-token/${token}`);

export const acceptInvitation = (payload) => api.post('/invitations/accept', payload);
