import axios from 'axios';

// In dev: Vite proxy handles /api → localhost:5000
const BASE_URL = import.meta.env.VITE_API_URL || 'https://booking-flow.onrender.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.response.use(
  res => res,
  err => {
    console.error('API Error:', {
      status: err.response?.status,
      url: err.config?.url,
      response: err.response?.data,
    });
    const message =
      err.response?.data?.message ||
      (Array.isArray(err.response?.data?.errors) ? err.response.data.errors[0] : null) ||
      err.message ||
      'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export const eventsAPI = {
  getAll:   (params)   => api.get('/events', { params }).then(r => r.data),
  getById:  (id)       => api.get(`/events/${id}`).then(r => r.data),
  create:   (data)     => api.post('/events', data).then(r => r.data),
  update:   (id, data) => api.put(`/events/${id}`, data).then(r => r.data),
  delete:   (id)       => api.delete(`/events/${id}`).then(r => r.data),
};

export const bookingsAPI = {
  getAll:   (params) => api.get('/bookings', { params }).then(r => r.data),
  create:   (data)   => api.post('/bookings', data).then(r => r.data),
  cancel:   (id)     => api.patch(`/bookings/${id}/cancel`).then(r => r.data),
  getStats: ()       => api.get('/bookings/stats').then(r => r.data),
};

export const uploadAPI = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'https://booking-flow.onrender.com';
    const res = await axios.post(`${serverUrl}/api/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });
    return res.data;
  },
};

// Export base server URL for direct fetch calls
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'https://booking-flow.onrender.com';

export default api;