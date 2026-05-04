import api from '../api/axiosInstance';

const createImageFormData = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return formData;
};

const uploadImage = (url, file) => api.post(url, createImageFormData(file), {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

export const uploadAvatar = (file) => uploadImage('/uploads/avatar', file);

export const uploadOrgLogo = (file) => uploadImage('/uploads/org-logo', file);
