import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Vite proxy will handle this
});

// Automatically attach JWT token if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers['x-auth-token'] = token;
    }
    return config;
});

export default api;
