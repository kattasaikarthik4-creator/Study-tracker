import api from './apiClient';

export const subjectApi = {
  getAll: () => api.get('/api/subjects'),
  getByCategory: (categoryId) => api.get(`/api/subjects/${categoryId}`),
  create: (data) => api.post('/api/subjects', data),
  update: (id, data) => api.put(`/api/subjects/${id}`, data),
  delete: (id) => api.delete(`/api/subjects/${id}`),
};
