import api from './apiClient';

export const topicApi = {
  getByChapter: (chapterId) => api.get(`/api/topics/${chapterId}`),
  create: (data) => api.post('/api/topics', data),
  update: (id, data) => api.put(`/api/topics/${id}`, data),
  delete: (id) => api.delete(`/api/topics/${id}`),
};
