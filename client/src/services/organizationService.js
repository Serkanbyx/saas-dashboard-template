import api from '../api/axiosInstance';

const myOrgsCache = {
  response: null,
  timestamp: 0,
};
const myOrgsCacheTtl = 30_000;

export const invalidateMyOrgsCache = () => {
  myOrgsCache.response = null;
  myOrgsCache.timestamp = 0;
};

export const createOrg = async (payload) => {
  const response = await api.post('/organizations', payload);
  invalidateMyOrgsCache();

  return response;
};

export const getMyOrgs = async ({ force = false } = {}) => {
  const isFresh = myOrgsCache.response && Date.now() - myOrgsCache.timestamp < myOrgsCacheTtl;

  if (!force && isFresh) {
    return myOrgsCache.response;
  }

  const response = await api.get('/organizations/mine');
  myOrgsCache.response = response;
  myOrgsCache.timestamp = Date.now();

  return response;
};

export const getOrgById = (orgId) => api.get(`/organizations/${orgId}`);

export const updateOrg = async (orgId, payload) => {
  const response = await api.patch(`/organizations/${orgId}`, payload);
  invalidateMyOrgsCache();

  return response;
};

export const deleteOrg = async (orgId, payload) => {
  const response = await api.delete(`/organizations/${orgId}`, { data: payload });
  invalidateMyOrgsCache();

  return response;
};
