import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
    useLocation,
    useNavigate,
} from 'react-router-dom';
import { LoginModal } from './components/common/LoginModal';
import { RoletaVipScreen } from './pages/RoletaVipScreen';
import { CheckoutSuccessScreen } from './pages/CheckoutSuccessScreen';
import { AdminDashboardScreen } from './pages/admin/AdminDashboardScreen';
import { AdminLoginScreen } from './pages/admin/AdminLoginScreen';
import { useAdminStore } from './store/useAdminStore';
import { useConfiguracoesStore } from './store/useConfiguracoesStore';
import { type AuthUser, useAuthStore } from './store/useAuthStore';
import { api, isCookieAuthMode } from './utils/api';
import { apiRoutes } from './utils/apiRoutes';
import { appRoutes } from './utils/appRoutes';

const pendingRoletaInviteStorageKey = 'viabras-pending-roleta-invite-code';
const attemptedRoletaInviteStoragePrefix = 'viabras-attempted-roleta-invite-code';

function getAttemptedRoletaInviteStorageKey(inviteCode: string) {
    return `${attemptedRoletaInviteStoragePrefix}:${encodeURIComponent(inviteCode)}`;
}

function waitForRoletaBootstrapRetry(durationMs: number) {
    return new Promise((resolve) => {
        window.setTimeout(resolve, durationMs);
    });
}

function isRoletaParticipantConflictError(error: unknown) {
    if (!axios.isAxiosError(error)) return false;

    const responseText = typeof error.response?.data === 'string'
        ? error.response.data
        : JSON.stringify(error.response?.data ?? {});

    return error.response?.status === 500 && (
        responseText.includes('uk_roleta_participante_usuario')
        || responseText.includes('roleta_participantes')
        || responseText.toLowerCase().includes('duplicate key')
    );
}

async function postRoletaInviteWithParticipantRetry(inviteCode: string) {
    try {
        await api.post(apiRoutes.roleta.convites, {
            codigoConvite: inviteCode,
        });
    } catch (error) {
        if (!isRoletaParticipantConflictError(error)) throw error;

        await waitForRoletaBootstrapRetry(450);
        await api.post(apiRoutes.roleta.convites, {
            codigoConvite: inviteCode,
        });
    }
}

interface AuthMeResponse {
    usuario?: Partial<AuthUser> | null;
    user?: Partial<AuthUser> | null;
}

function normalizeAuthUser(apiUser: Partial<AuthUser>): AuthUser {
    const name = typeof apiUser.nome === 'string'
        ? apiUser.nome
        : typeof apiUser.name === 'string'
            ? apiUser.name
            : '';
    const phone = typeof apiUser.telefone === 'string'
        ? apiUser.telefone
        : typeof apiUser.phone === 'string'
            ? apiUser.phone
            : '';

    return {
        ...apiUser,
        name,
        nome: name,
        phone,
        telefone: phone,
    };
}

function normalizeRoutePath(pathname: string) {
    if (pathname === '/') return pathname;
    return pathname.replace(/\/+$/, '');
}

export default function App() {
    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    );
}

function AppRoutes() {
    const navigate = useNavigate();
    const location = useLocation();
    const normalizedPathname = normalizeRoutePath(location.pathname);
    const fetchPublicConfiguracoes = useConfiguracoesStore((state) => state.fetchPublicConfiguracoes);
    const adminUser = useAdminStore((state) => state.currentUser);
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const hasHydrated = useAuthStore((state) => state.hasHydrated);
    const setSession = useAuthStore((state) => state.setSession);
    const logout = useAuthStore((state) => state.logout);
    const [pendingRoletaInviteCode, setPendingRoletaInviteCode] = useState<string | null>(null);
    const [isRestoringCookieSession, setIsRestoringCookieSession] = useState(isCookieAuthMode);
    const registeringRoletaInviteCodeRef = useRef<string | null>(null);
    const isAuthenticated = isCookieAuthMode ? Boolean(user) : Boolean(token && user);
    const isAdminRoute = normalizedPathname === appRoutes.admin;
    const isRoletaRoute = normalizedPathname === appRoutes.root || normalizedPathname === appRoutes.roletaVip;
    const appBackground = isRoletaRoute ? '#e6e6e6' : '#FAF7F2';

    useEffect(() => {
        if (!isRoletaRoute || isAdminRoute) return;

        const params = new URLSearchParams(location.search);
        const inviteCode = params.get('ref')?.trim();
        const storedInviteCode = window.sessionStorage.getItem(pendingRoletaInviteStorageKey);
        const nextInviteCode = inviteCode || storedInviteCode;

        if (nextInviteCode) {
            if (
                registeringRoletaInviteCodeRef.current === nextInviteCode
                || window.sessionStorage.getItem(getAttemptedRoletaInviteStorageKey(nextInviteCode)) === '1'
            ) {
                return;
            }

            window.sessionStorage.setItem(pendingRoletaInviteStorageKey, nextInviteCode);
            setPendingRoletaInviteCode(nextInviteCode);
        }
    }, [isAdminRoute, isRoletaRoute, location.search]);

    useEffect(() => {
        void fetchPublicConfiguracoes();
    }, [fetchPublicConfiguracoes]);

    useEffect(() => {
        if (!isCookieAuthMode || !hasHydrated) return;

        let isActive = true;

        const restoreCookieSession = async () => {
            setIsRestoringCookieSession(true);

            try {
                const { data } = await api.get<AuthMeResponse>(apiRoutes.auth.me);
                const apiUser = data.usuario ?? data.user;

                if (apiUser && isActive) {
                    setSession(null, normalizeAuthUser(apiUser));
                } else if (isActive) {
                    logout();
                }
            } catch {
                if (isActive) logout();
            } finally {
                if (isActive) setIsRestoringCookieSession(false);
            }
        };

        void restoreCookieSession();

        return () => {
            isActive = false;
        };
    }, [hasHydrated, logout, setSession]);

    useEffect(() => {
        if (!isRoletaRoute || !hasHydrated || !pendingRoletaInviteCode || !isAuthenticated || !user) return;
        if (registeringRoletaInviteCodeRef.current === pendingRoletaInviteCode) return;

        const attemptedInviteStorageKey = getAttemptedRoletaInviteStorageKey(pendingRoletaInviteCode);
        if (window.sessionStorage.getItem(attemptedInviteStorageKey) === '1') {
            window.sessionStorage.removeItem(pendingRoletaInviteStorageKey);
            setPendingRoletaInviteCode(null);
            return;
        }

        let isActive = true;
        registeringRoletaInviteCodeRef.current = pendingRoletaInviteCode;

        const registerRoletaInvite = async () => {
            try {
                await postRoletaInviteWithParticipantRetry(pendingRoletaInviteCode);
            } catch {
                // O acesso a roleta nao depende da conversao do convite.
            } finally {
                window.sessionStorage.setItem(attemptedInviteStorageKey, '1');
                if (registeringRoletaInviteCodeRef.current === pendingRoletaInviteCode) {
                    registeringRoletaInviteCodeRef.current = null;
                }

                if (!isActive) return;

                window.sessionStorage.removeItem(pendingRoletaInviteStorageKey);
                setPendingRoletaInviteCode(null);

                const params = new URLSearchParams(location.search);
                params.delete('ref');
                navigate({
                    pathname: location.pathname,
                    search: params.toString() ? `?${params.toString()}` : '',
                }, { replace: true });
            }
        };

        void registerRoletaInvite();

        return () => {
            isActive = false;
        };
    }, [
        hasHydrated,
        isAuthenticated,
        isRoletaRoute,
        location.pathname,
        location.search,
        navigate,
        pendingRoletaInviteCode,
        user,
    ]);

    if (!hasHydrated || isRestoringCookieSession) {
        return (
            <div
                style={{ minHeight: '100dvh', background: appBackground }}
                aria-label="Carregando sessão"
            />
        );
    }

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                overflow: 'hidden',
                background: appBackground,
            }}
        >
            <Routes>
                <Route path={appRoutes.root} element={<RoletaVipScreen />} />
                <Route path={appRoutes.roletaVip} element={<RoletaVipScreen />} />
                <Route path={appRoutes.checkoutSuccess} element={<CheckoutSuccessScreen />} />
                <Route
                    path={appRoutes.admin}
                    element={adminUser ? <AdminDashboardScreen /> : <AdminLoginScreen />}
                />
                <Route path="*" element={<Navigate to={appRoutes.root} replace />} />
            </Routes>

            {!isAdminRoute && !isAuthenticated && <LoginModal roletaBackdrop={isRoletaRoute} />}
        </div>
    );
}
