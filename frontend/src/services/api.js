import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.post('/auth/profile'),
  changePassword: (data) => api.post('/auth/change-password', data)
};

export const businessesApi = {
  getAll: (params) => api.get('/businesses', { params }),
  getById: (id) => api.get(`/businesses/${id}`),
  create: (data) => api.post('/businesses', data),
  update: (id, data) => api.put(`/businesses/${id}`, data),
  toggleStatus: (id) => api.patch(`/businesses/${id}/toggle-status`),
  delete: (id) => api.delete(`/businesses/${id}`),
  getStats: () => api.get('/businesses/stats')
};

export const usersApi = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
  resetPassword: (id, data) => api.post(`/users/${id}/reset-password`, data),
  delete: (id) => api.delete(`/users/${id}`),
  setTabOverride: (userId, data) => api.put(`/users/${userId}/tab-override`, data),
  setActionOverride: (userId, data) => api.put(`/users/${userId}/action-override`, data),
  clearTabOverride: (userId, permissionId) => api.delete(`/users/${userId}/tab-override/${permissionId}`),
  clearActionOverride: (userId, permissionId) => api.delete(`/users/${userId}/action-override/${permissionId}`),
  getEffectivePermissions: (userId) => api.get(`/users/permissions/${userId}`)
};

export const rolesApi = {
  getAll: () => api.get('/roles'),
  getById: (id) => api.get(`/roles/${id}`),
  create: (data) => api.post('/roles', data),
  update: (id, data) => api.put(`/roles/${id}`, data),
  delete: (id) => api.delete(`/roles/${id}`),
  setTabPermissions: (id, data) => api.put(`/roles/${id}/tab-permissions`, data),
  setActionPermissions: (id, data) => api.put(`/roles/${id}/action-permissions`, data),
  getDefaultPermissions: () => api.get('/roles/permissions')
};

export const itemsApi = {
  getAll: (params) => api.get('/items', { params }),
  getById: (id) => api.get(`/items/${id}`),
  create: (data) => api.post('/items', data),
  update: (id, data) => api.put(`/items/${id}`, data),
  toggleStatus: (id) => api.patch(`/items/${id}/toggle-status`),
  delete: (id) => api.delete(`/items/${id}`),
  getCategories: () => api.get('/items/categories'),
  getStats: () => api.get('/items/stats')
};

export const transactionsApi = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  getSummary: (params) => api.get('/transactions/summary', { params }),
  getByDateRange: (params) => api.get('/transactions/date-range', { params })
};

export const reportsApi = {
  getDashboard: () => api.get('/reports/dashboard'),
  getDailyLogs: (params) => api.get('/reports/daily-logs', { params }),
  getFinancialSummary: (params) => api.get('/reports/financial-summary', { params }),
  getCategoryBreakdown: (params) => api.get('/reports/category-breakdown', { params }),
  getTrends: (params) => api.get('/reports/trends', { params }),
  getTopItems: (params) => api.get('/reports/top-items', { params }),
  exportTransactions: (params) => api.get('/reports/export', { params, responseType: 'blob' }),
  getCategories: (params) => api.get('/reports/categories', { params }),
  createCategory: (data) => api.post('/reports/categories', data),
  updateCategory: (id, data) => api.put(`/reports/categories/${id}`, data),
  toggleCategoryStatus: (id) => api.patch(`/reports/categories/${id}/toggle-status`),
  deleteCategory: (id) => api.delete(`/reports/categories/${id}`),
  getActivityLogs: (params) => api.get('/reports/activity-logs', { params }),
  getNotifications: (params) => api.get('/reports/notifications', { params }),
  markNotificationRead: (id) => api.patch(`/reports/notifications/${id}/read`)
};

export default api;
