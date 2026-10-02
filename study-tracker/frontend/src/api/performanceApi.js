import api from './apiClient';

export const performanceApi = {
  getGate: () => api.get('/api/performance/gate'),
  getSemester: () => api.get('/api/performance/semester'),
  getLabs: () => api.get('/api/performance/labs'),
  getCategoryById: (categoryId) => api.get(`/api/performance/category/${categoryId}`),
  getSubject: (subjectId) => api.get(`/api/performance/subject/${subjectId}`),
  getChapter: (chapterId) => api.get(`/api/performance/chapter/${chapterId}`),
  getTopic: (topicId) => api.get(`/api/performance/topic/${topicId}`),
};
