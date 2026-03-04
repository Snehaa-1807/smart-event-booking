import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.response.use(
  res => res,
  err => {
    // Log full error for debugging
    console.error('API Error:', {
      status: err.response?.status,
      url: err.config?.url,
      body: err.config?.data,
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
    const res = await axios.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });
    return res.data;
  },
};

export default api;