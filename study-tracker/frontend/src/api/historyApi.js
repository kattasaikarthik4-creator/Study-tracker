import api from './apiClient';

export const historyApi = {
  getSevenDays: () => api.get('/api/history/7-days'),
  getThirtyDays: () => api.get('/api/history/30-days'),
  getCustom: (days) => api.get(`/api/history/custom?days=${days}`),
};
