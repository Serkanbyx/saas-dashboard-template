import api from '../api/axiosInstance';

export const register = (payload) => api.post('/auth/register', payload);

export const login = (payload) => api.post('/auth/login', payload);

export const getMe = () => api.get('/auth/me');

export const updateProfile = (payload) => api.patch('/auth/me', payload);

export const changePassword = (payload) => api.patch('/auth/me/password', payload);

export const completeOnboarding = () => api.post('/auth/me/complete-onboarding');

export const deleteAccount = (payload) => api.delete('/auth/me', { data: payload });
