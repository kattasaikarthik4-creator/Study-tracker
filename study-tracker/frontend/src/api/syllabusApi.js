import api from './apiClient';

export const syllabusApi = {
  getFullTree: (categoryId) => api.get(categoryId ? `/api/syllabus?category_id=${categoryId}` : '/api/syllabus'),
  createSubject: (data) => api.post('/api/syllabus/subject', data),
  createChapter: (data) => api.post('/api/syllabus/chapter', data),
  createTopic: (data) => api.post('/api/syllabus/topic', data),
};
