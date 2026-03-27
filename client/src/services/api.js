import axios from 'axios';

// Centralized Axios instance for standardized API communication
const api = axios.create({
    baseURL: '/api', // Vite proxy handles the mapping to the backend port
});

// Interceptor to automatically attach the security token to every outgoing request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['x-auth-token'] = token;
    }
    return config;
});

// Global error handler to intercept 401 Unauthorized responses
// Forces a logout and redirect if the session is invalidated or expired
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
