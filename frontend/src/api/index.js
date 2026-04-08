import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  getMe: () => apiClient.get('/auth/me'),
};

export const issuesAPI = {
  getAll: (params) => apiClient.get('/issues', { params }),
  create: (data) => apiClient.post('/issues', data),
  update: (id, data) => apiClient.put(`/issues/${id}`, data),
  delete: (id) => apiClient.delete(`/issues/${id}`),
};

export const analyzeAPI = {
  analyze: (data) => apiClient.post('/analyze', data),
  getHistory: (params) => apiClient.get('/analyze/history', { params }),
  getById: (id) => apiClient.get(`/analyze/history/${id}`),
};

export const notificationsAPI = {
  getAll: (params) => apiClient.get('/notifications', { params }),
  getUnreadCount: () => apiClient.get('/notifications/unread-count'),
  markAsRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.patch('/notifications/read-all'),
  delete: (id) => apiClient.delete(`/notifications/${id}`),
  clearAll: () => apiClient.delete('/notifications'),
};

export const aiAPI = {
  analyze: (data) => apiClient.post('/ai/analyze', data),
  fix: (data) => apiClient.post('/ai/fix', data),
};

export const analyticsAPI = {
  getDashboard: () => apiClient.get('/analytics'),
};

export default apiClient;
