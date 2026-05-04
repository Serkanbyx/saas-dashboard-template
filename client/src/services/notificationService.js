import api from '../api/axiosInstance';

export const listMyNotifications = (params) => api.get('/notifications', { params });

export const getUnreadCount = (params) => api.get('/notifications/unread-count', { params });

export const markAsRead = (notificationId) => api.patch(`/notifications/${notificationId}/read`);

export const markAllAsRead = (params) => api.patch('/notifications/read-all', null, { params });

export const deleteNotification = (notificationId) => api.delete(`/notifications/${notificationId}`);
