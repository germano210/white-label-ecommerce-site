import { useEffect, useState } from 'react';
import { LoginModal } from './components/common/LoginModal';
import { DiscoveryScreen } from './pages/DiscoveryScreen';
import { CurtidasScreen } from './pages/CurtidasScreen';
import { AdminDashboardScreen } from './pages/admin/AdminDashboardScreen';
import { AdminLoginScreen } from './pages/admin/AdminLoginScreen';
import { type CurtidasMode, useDiscoveryStore } from './store/useDiscoveryStore';
import { useMissaoStore } from './store/useMissaoStore';
import { useAdminStore } from './store/useAdminStore';
import { useAuthStore } from './store/useAuthStore';
import { api } from './utils/api';
import { apiRoutes } from './utils/apiRoutes';

type AppScreen = 'discovery' | 'curtidas';
const pendingShareStorageKey = 'viabras-pending-share-code';

export default function App() {
    const { isAdminModeOpen, currentUser, toggleAdminMode } = useAdminStore();
    const setCurtidasMode = useDiscoveryStore((state) => state.setCurtidasMode);
    const fetchMissoes = useMissaoStore((state) => state.fetchMissoes);
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const hasHydrated = useAuthStore((state) => state.hasHydrated);
    const [currentScreen, setCurrentScreen] = useState<AppScreen>('discovery');
    const [pendingShareCode, setPendingShareCode] = useState<string | null>(null);

    const handleSecretClick = (event: React.MouseEvent) => {
        if (event.detail === 2) {
            toggleAdminMode();
        }
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const shareCode = params.get('share')?.trim();
        const storedShareCode = window.sessionStorage.getItem(pendingShareStorageKey);
        const nextShareCode = shareCode || storedShareCode;

        if (nextShareCode) {
            window.sessionStorage.setItem(pendingShareStorageKey, nextShareCode);
            setPendingShareCode(nextShareCode);
        }
    }, []);

    useEffect(() => {
        const handleFocus = () => {
            void fetchMissoes();
        };

        void fetchMissoes();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [fetchMissoes]);

    useEffect(() => {
        if (!hasHydrated || !pendingShareCode || !token || !user) return;

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

                const url = new URL(window.location.href);
                url.searchParams.delete('share');
                window.history.replaceState(
                    window.history.state,
                    '',
                    `${url.pathname}${url.search}${url.hash}`,
                );

                void fetchMissoes();
            }
        };

        void registerShareOpen();

        return () => {
            isActive = false;
        };
    }, [fetchMissoes, hasHydrated, pendingShareCode, token, user]);

    if (!hasHydrated) {
        return (
            <div
                style={{ minHeight: '100dvh', background: '#FAF7F2' }}
                aria-label="Carregando sessão"
            />
        );
    }

    if (isAdminModeOpen) {
        return currentUser ? <AdminDashboardScreen /> : <AdminLoginScreen />;
    }

    const isAuthenticated = Boolean(token && user);
    const navigateToCurtidas = (mode: CurtidasMode = 'lista') => {
        setCurtidasMode(mode);
        setCurrentScreen('curtidas');
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
            {currentScreen === 'curtidas' ? (
                <CurtidasScreen onBack={() => setCurrentScreen('discovery')} />
            ) : (
                <DiscoveryScreen
                    onLogoDoubleClick={handleSecretClick}
                    onNavigateToCurtidas={navigateToCurtidas}
                />
            )}
            {!isAuthenticated && <LoginModal />}
        </div>
    );
}
