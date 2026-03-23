import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add token to headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  register: (nombre: string, email: string, password: string) => 
    api.post('/auth/register', { nombre, email, password }),
  
  getProfile: () => 
    api.get('/auth/profile')
};

// Appointment API
export const appointmentAPI = {
  getAll: () => 
    api.get('/appointments'),
  
  getById: (id: number) => 
    api.get(`/appointments/${id}`),
  
  create: (data: any) => 
    api.post('/appointments', data),
  
  updateStatus: (id: number, estado: string) => 
    api.patch(`/appointments/${id}/status`, { estado }),
  
  updatePaymentStatus: (id: number, pagoEstado: string) => 
    api.patch(`/appointments/${id}/payment-status`, { pagoEstado }),
  
  getByDate: (date: string) => 
    api.get(`/appointments/date/${date}`)
};

// Service API
export const serviceAPI = {
  getAll: () => 
    api.get('/services'),
  
  getById: (id: number) => 
    api.get(`/services/${id}`),
  
  create: (data: any) => 
    api.post('/services', data),
  
  update: (id: number, data: any) => 
    api.put(`/services/${id}`, data),
  
  delete: (id: number) => 
    api.delete(`/services/${id}`)
};

// Product API
export const productAPI = {
  getAll: () => 
    api.get('/products'),
  
  getById: (id: number) => 
    api.get(`/products/${id}`),
  
  create: (data: any) => 
    api.post('/products', data),
  
  update: (id: number, data: any) => 
    api.put(`/products/${id}`, data),
  
  delete: (id: number) => 
    api.delete(`/products/${id}`)
};

// Client API
export const clientAPI = {
  getAll: () => 
    api.get('/clients'),
  
  getById: (id: number) => 
    api.get(`/clients/${id}`),
  
  create: (data: any) => 
    api.post('/clients', data),
  
  update: (id: number, data: any) => 
    api.put(`/clients/${id}`, data),
  
  delete: (id: number) => 
    api.delete(`/clients/${id}`)
};

export default api;