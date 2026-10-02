import api from './apiClient';

export const categoryApi = {
  getAll: () => api.get('/api/categories'),
  create: (data) => api.post('/api/categories', data),
};
