import api from './apiClient';

export const scheduleApi = {
  getAll: (day) => api.get(day ? `/api/schedule?day=${day}` : '/api/schedule'),
  create: (data) => api.post('/api/schedule', data),
  update: (id, data) => api.put(`/api/schedule/${id}`, data),
  delete: (id) => api.delete(`/api/schedule/${id}`),
};
