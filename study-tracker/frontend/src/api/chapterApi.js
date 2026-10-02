import api from './apiClient';

export const chapterApi = {
  getBySubject: (subjectId) => api.get(`/api/chapters/${subjectId}`),
  create: (data) => api.post('/api/chapters', data),
  update: (id, data) => api.put(`/api/chapters/${id}`, data),
  delete: (id) => api.delete(`/api/chapters/${id}`),
};
