import axios from 'axios';
import { useAdminStore } from '../store/useAdminStore';
import { useAuthStore } from '../store/useAuthStore';

export const authMode = import.meta.env.VITE_AUTH_MODE === 'cookie' ? 'cookie' : 'jwt';
export const isCookieAuthMode = authMode === 'cookie';

function normalizeApiBaseUrl(url: string | undefined) {
    const normalizedUrl = url?.trim().replace(/\/$/, '') ?? '';

    if (!normalizedUrl || normalizedUrl === '/' || normalizedUrl === '/api') {
        return '';
    }

    return normalizedUrl;
}

function resolveApiBaseUrl() {
    const envBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

    if (envBaseUrl) return envBaseUrl;

    return import.meta.env.DEV ? 'http://localhost:8080' : '';
}

const apiBaseUrl = resolveApiBaseUrl();

export const api = axios.create({
    baseURL: apiBaseUrl,
    timeout: 15_000,
    withCredentials: isCookieAuthMode,
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
 * Modo atual `jwt`: mantém compatibilidade temporária com o token salvo pelo
 * Zustand e anexa `Authorization: Bearer <token>`. Esse modelo funciona, mas
 * expõe o JWT ao JavaScript e deve ser trocado por cookie HttpOnly antes de
 * lidar com operações sensíveis em produção.
 *
 * Modo futuro `cookie` (`VITE_AUTH_MODE=cookie`): o Axios envia cookies com
 * `withCredentials`, não lê tokens de localStorage/sessionStorage e não injeta
 * Authorization. Nesse modo, a sessão deve ser restaurada por `GET /api/auth/me`.
 */
api.interceptors.request.use((config) => {
    if (isCookieAuthMode) return config;

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
