import { useEffect, useState } from 'react';
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
import {
    clearPendingIndicationCode,
    storePendingIndicationCode,
} from './utils/indicacaoReferral';

const openedIndicationStoragePrefix = 'brechodacami-opened-indication-code';

function getOpenedIndicationStorageKey(indicationCode: string) {
    return `${openedIndicationStoragePrefix}:${encodeURIComponent(indicationCode)}`;
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
    const [isRestoringCookieSession, setIsRestoringCookieSession] = useState(isCookieAuthMode);
    const isAuthenticated = isCookieAuthMode ? Boolean(user) : Boolean(token && user);
    const isAdminRoute = normalizedPathname === appRoutes.admin;
    const isRoletaRoute = normalizedPathname === appRoutes.root || normalizedPathname === appRoutes.roletaVip;
    const appBackground = isRoletaRoute ? '#e6e6e6' : '#FAF7F2';

    useEffect(() => {
        if (!isRoletaRoute || isAdminRoute) return;

        const params = new URLSearchParams(location.search);
        const inviteCode = params.get('ref')?.trim();
        if (!inviteCode) return;

        if (!isAuthenticated) {
            storePendingIndicationCode(inviteCode);
        }

        const openedStorageKey = getOpenedIndicationStorageKey(inviteCode);
        if (window.sessionStorage.getItem(openedStorageKey) === '1') return;

        window.sessionStorage.setItem(openedStorageKey, '1');
        void api.post(apiRoutes.indicacoes.open(inviteCode)).catch(() => {
            // A roleta continua acessivel mesmo se o tracking da abertura falhar.
        });
    }, [isAdminRoute, isAuthenticated, isRoletaRoute, location.search]);

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
        if (!isRoletaRoute || !hasHydrated || !isAuthenticated) return;

        clearPendingIndicationCode();

        const params = new URLSearchParams(location.search);
        if (!params.has('ref')) return;

        params.delete('ref');
        navigate({
            pathname: location.pathname,
            search: params.toString() ? `?${params.toString()}` : '',
        }, { replace: true });
    }, [
        hasHydrated,
        isAuthenticated,
        isRoletaRoute,
        location.pathname,
        location.search,
        navigate,
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
