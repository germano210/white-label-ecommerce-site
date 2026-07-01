import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const apiBaseUrl = (
    import.meta.env.VITE_API_BASE_URL
    ?? import.meta.env.VITE_API_URL
    ?? 'http://192.168.1.254:8080'
).replace(/\/$/, '');

export const api = axios.create({
    baseURL: apiBaseUrl,
    timeout: 15_000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            useAuthStore.getState().logout();
        }

        return Promise.reject(error);
    },
);
