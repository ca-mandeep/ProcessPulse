import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Optionally redirect to login
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

// Auth API functions
export const authAPI = {
  register: async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },
  
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  updateProfile: async (updates) => {
    const response = await api.put('/auth/profile', updates);
    return response.data;
  }
};

// Import API functions
export const importAPI = {
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/import/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  processImport: async (importId, columnMapping) => {
    const response = await api.post(`/import/process/${importId}`, { columnMapping });
    return response.data;
  },
  
  getHistory: async () => {
    const response = await api.get('/import/history');
    return response.data;
  },
  
  clearAllData: async () => {
    const response = await api.delete('/import/clear');
    return response.data;
  }
};

// Process Mining API functions
export const processAPI = {
  // Get overall statistics
  getStats: () => api.get('/process/stats'),
  
  // Get process flow data for visualization
  getProcessFlow: () => api.get('/process/flow'),
  
  // Get cases with optional filters
  getCases: (params = {}) => api.get('/process/cases', { params }),
  
  // Get single case details with events
  getCaseDetails: (caseId) => api.get(`/process/cases/${caseId}`),
  
  // Get variant analysis
  getVariants: () => api.get('/process/variants'),
  
  // Get activity metrics
  getActivities: () => api.get('/process/activities'),
  
  // Get time-based analytics
  getTimeAnalytics: (groupBy = 'day') => api.get('/process/analytics/time', { params: { groupBy } }),
  
  // Get bottleneck analysis
  getBottlenecks: () => api.get('/process/analytics/bottlenecks'),
  
  // Get filter options
  getFilterOptions: () => api.get('/process/filters'),
};

export default api;
