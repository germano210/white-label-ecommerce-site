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
import { DiscoveryScreen } from './pages/DiscoveryScreen';
import { CurtidasScreen } from './pages/CurtidasScreen';
import { ExplorarScreen } from './pages/ExplorarScreen';
import { PerfilScreen } from './pages/PerfilScreen';
import { IndiqueScreen } from './pages/IndiqueScreen';
import { CheckoutSuccessScreen } from './pages/CheckoutSuccessScreen';
import { AdminDashboardScreen } from './pages/admin/AdminDashboardScreen';
import { AdminLoginScreen } from './pages/admin/AdminLoginScreen';
import { type CurtidasMode, useDiscoveryStore } from './store/useDiscoveryStore';
import { useMissaoStore } from './store/useMissaoStore';
import { useAdminStore } from './store/useAdminStore';
import { type AuthUser, useAuthStore } from './store/useAuthStore';
import { api, isCookieAuthMode } from './utils/api';
import { apiRoutes } from './utils/apiRoutes';
import { appRoutes } from './utils/appRoutes';

const pendingShareStorageKey = 'viabras-pending-share-code';

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
    const setCurtidasMode = useDiscoveryStore((state) => state.setCurtidasMode);
    const fetchMissoes = useMissaoStore((state) => state.fetchMissoes);
    const adminUser = useAdminStore((state) => state.currentUser);
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const hasHydrated = useAuthStore((state) => state.hasHydrated);
    const setSession = useAuthStore((state) => state.setSession);
    const logout = useAuthStore((state) => state.logout);
    const [pendingShareCode, setPendingShareCode] = useState<string | null>(null);
    const [isRestoringCookieSession, setIsRestoringCookieSession] = useState(isCookieAuthMode);
    const isAuthenticated = isCookieAuthMode ? Boolean(user) : Boolean(token && user);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const shareCode = params.get('share')?.trim();
        const storedShareCode = window.sessionStorage.getItem(pendingShareStorageKey);
        const nextShareCode = shareCode || storedShareCode;

        if (nextShareCode) {
            window.sessionStorage.setItem(pendingShareStorageKey, nextShareCode);
            setPendingShareCode(nextShareCode);
        }
    }, [location.search]);

    useEffect(() => {
        const handleFocus = () => {
            void fetchMissoes();
        };

        void fetchMissoes();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [fetchMissoes]);

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
        if (!hasHydrated || !pendingShareCode || !isAuthenticated || !user) return;

        let isActive = true;

        const registerShareOpen = async () => {
            try {
                await api.post(apiRoutes.compartilhamentos.open(pendingShareCode));
            } catch {
                // A navegação não depende do registro da abertura do compartilhamento.
            } finally {
                if (!isActive) return;

                window.sessionStorage.removeItem(pendingShareStorageKey);
                setPendingShareCode(null);

                const params = new URLSearchParams(location.search);
                params.delete('share');
                navigate({
                    pathname: location.pathname,
                    search: params.toString() ? `?${params.toString()}` : '',
                }, { replace: true });

                void fetchMissoes();
            }
        };

        void registerShareOpen();

        return () => {
            isActive = false;
        };
    }, [
        fetchMissoes,
        hasHydrated,
        isAuthenticated,
        location.pathname,
        location.search,
        navigate,
        pendingShareCode,
        user,
    ]);

    if (!hasHydrated || isRestoringCookieSession) {
        return (
            <div
                style={{ minHeight: '100dvh', background: '#FAF7F2' }}
                aria-label="Carregando sessão"
            />
        );
    }

    const isAdminRoute = location.pathname === appRoutes.admin;

    const navigateToCurtidas = (mode: CurtidasMode = 'lista') => {
        setCurtidasMode(mode);
        navigate(mode === 'resgate' ? appRoutes.resgate : appRoutes.curtidas);
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                overflow: 'hidden',
                background: '#FAF7F2',
            }}
        >
            <Routes>
                <Route path={appRoutes.root} element={<Navigate to={appRoutes.forYou} replace />} />
                <Route
                    path={appRoutes.forYou}
                    element={(
                        <DiscoveryScreen
                            onNavigateToPath={(path) => navigate(path)}
                            onNavigateToCurtidas={navigateToCurtidas}
                        />
                    )}
                />
                <Route path={appRoutes.explorar} element={<ExplorarScreen />} />
                <Route
                    path={appRoutes.curtidas}
                    element={<CurtidasRoute mode="lista" onBack={() => navigate(appRoutes.forYou)} />}
                />
                <Route
                    path={appRoutes.resgate}
                    element={<CurtidasRoute mode="resgate" onBack={() => navigate(appRoutes.forYou)} />}
                />
                <Route path={appRoutes.perfil} element={<PerfilScreen />} />
                <Route path={appRoutes.indique} element={<IndiqueScreen />} />
                <Route path={appRoutes.checkoutSuccess} element={<CheckoutSuccessScreen />} />
                <Route
                    path={appRoutes.admin}
                    element={adminUser ? <AdminDashboardScreen /> : <AdminLoginScreen />}
                />
                <Route path="*" element={<Navigate to={appRoutes.forYou} replace />} />
            </Routes>

            {!isAdminRoute && !isAuthenticated && <LoginModal />}
        </div>
    );
}

interface CurtidasRouteProps {
    mode: CurtidasMode;
    onBack: () => void;
}

function CurtidasRoute({ mode, onBack }: CurtidasRouteProps) {
    const setCurtidasMode = useDiscoveryStore((state) => state.setCurtidasMode);

    useEffect(() => {
        setCurtidasMode(mode);
    }, [mode, setCurtidasMode]);

    return <CurtidasScreen onBack={onBack} />;
}
