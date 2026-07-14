// API Client — Axios wrapper for REST endpoints
import axios from 'axios';
import { useAuthStore } from './store';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Inject auth token on every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, name) => api.post('/auth/register', { email, password, name }),
  me: () => api.get('/auth/me'),
};

// KB endpoints
export const kbAPI = {
  list: (params) => api.get('/kb', { params }),
  get: (id) => api.get(`/kb/${id}`),
  create: (data) => api.post('/kb', data),
  update: (id, data) => api.put(`/kb/${id}`, data),
  delete: (id) => api.delete(`/kb/${id}`),
  categories: () => api.get('/kb/categories'),
};

// Ticket endpoints
export const ticketAPI = {
  list: (params) => api.get('/tickets', { params }),
  stats: () => api.get('/tickets/stats'),
  update: (id, data) => api.put(`/tickets/${id}`, data),
};

// Analytics endpoints
export const analyticsAPI = {
  overview: () => api.get('/analytics'),
  intents: () => api.get('/analytics/intents'),
  sentiment: () => api.get('/analytics/sentiment'),
  conversationsOverTime: () => api.get('/analytics/conversations-over-time'),
};

// Conversation endpoints
export const conversationAPI = {
  list: (params) => api.get('/conversations', { params }),
  get: (id) => api.get(`/conversations/${id}`),
};

export default api;
