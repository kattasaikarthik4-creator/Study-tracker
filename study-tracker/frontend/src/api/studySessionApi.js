import api from './apiClient';

export const studySessionApi = {
  create: (data) => api.post('/api/study-sessions', data),
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/api/study-sessions${query ? `?${query}` : ''}`);
  },
  getToday: () => api.get('/api/study-sessions/today'),
  getSevenDays: () => api.get('/api/study-sessions/7-days'),
  getById: (id) => api.get(`/api/study-sessions/${id}`),
  delete: (id) => api.delete(`/api/study-sessions/${id}`),
};
