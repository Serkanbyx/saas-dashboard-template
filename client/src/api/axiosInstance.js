import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: false,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('saas:token');
  const orgId = localStorage.getItem('saas:activeOrgId');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (orgId) {
    config.headers['x-org-id'] = orgId;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('saas:token');
      localStorage.removeItem('saas:activeOrgId');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export default api;
