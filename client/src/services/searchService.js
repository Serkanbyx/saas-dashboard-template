import api from '../api/axiosInstance';

export const globalSearch = (q, types, limit) => api.get('/search', {
  params: {
    q,
    types: Array.isArray(types) ? types.join(',') : types,
    limit,
  },
});
