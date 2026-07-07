import axios from 'axios';
import { useAdminStore } from '../store/useAdminStore';
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

const ADMIN_TOKEN_STORAGE_KEYS = [
    'viabras-admin-token',
    'viabras-admin-storage',
    'adminToken',
    'admin_token',
    'adminAccessToken',
    'admin_access_token',
];

const AUTH_TOKEN_STORAGE_KEYS = [
    'viabras-auth-storage',
    'authToken',
    'auth_token',
    'accessToken',
    'token',
];

function normalizeToken(token?: string | null) {
    const normalizedToken = token?.replace(/^Bearer\s+/i, '').trim();
    return normalizedToken || null;
}

function readTokenFromSerializedValue(value: string | null) {
    if (!value) return null;

    const directToken = normalizeToken(value);

    try {
        const parsedValue = JSON.parse(value) as unknown;

        if (typeof parsedValue === 'string') {
            return normalizeToken(parsedValue);
        }

        if (parsedValue && typeof parsedValue === 'object') {
            const record = parsedValue as Record<string, unknown>;
            const state = record.state;
            const stateRecord = state && typeof state === 'object'
                ? state as Record<string, unknown>
                : undefined;
            const token = record.token ?? record.accessToken ?? stateRecord?.token ?? stateRecord?.accessToken;

            if (typeof token === 'string') {
                return normalizeToken(token);
            }
        }
    } catch {
        return directToken;
    }

    return directToken;
}

function readTokenFromStorage(keys: string[]) {
    if (typeof window === 'undefined') return null;

    for (const storage of [window.localStorage, window.sessionStorage]) {
        for (const key of keys) {
            const token = readTokenFromSerializedValue(storage.getItem(key));

            if (token) return token;
        }
    }

    return null;
}

function getAdminToken() {
    return normalizeToken(useAdminStore.getState().token)
        ?? readTokenFromStorage(ADMIN_TOKEN_STORAGE_KEYS);
}

function getAuthToken() {
    return normalizeToken(useAuthStore.getState().token)
        ?? readTokenFromStorage(AUTH_TOKEN_STORAGE_KEYS);
}

function isAdminRequest(url?: string) {
    return Boolean(url?.includes('/api/admin/'));
}

function getRequestToken(url?: string) {
    const adminToken = getAdminToken();
    const authToken = getAuthToken();

    return isAdminRequest(url)
        ? adminToken ?? authToken
        : authToken ?? adminToken;
}

/**
 * Injeta o Bearer Token no momento exato da requisição.
 *
 * O interceptor lê os estados atuais do Zustand e, como fallback, consulta
 * localStorage/sessionStorage para cobrir recarregamentos de página ou fluxos
 * externos de autenticação. Rotas administrativas (`/api/admin/**`) priorizam
 * o token do painel admin; as demais priorizam o token do cliente. Quando um
 * token válido é encontrado, ele é anexado como `Authorization: Bearer <token>`.
 */
api.interceptors.request.use((config) => {
    const token = getRequestToken(config.url);

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            if (isAdminRequest(error.config?.url)) {
                useAdminStore.getState().logout();
            } else {
                useAuthStore.getState().logout();
            }
        }

        return Promise.reject(error);
    },
);
