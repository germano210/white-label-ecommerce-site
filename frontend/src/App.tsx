import { LoginModal } from './components/common/LoginModal';
import { DiscoveryScreen } from './pages/DiscoveryScreen';
import { AdminDashboardScreen } from './pages/admin/AdminDashboardScreen';
import { AdminLoginScreen } from './pages/admin/AdminLoginScreen';
import { useAdminStore } from './store/useAdminStore';
import { useAuthStore } from './store/useAuthStore';

export default function App() {
    const { isAdminModeOpen, currentUser, toggleAdminMode } = useAdminStore();
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const hasHydrated = useAuthStore((state) => state.hasHydrated);

    const handleSecretClick = (event: React.MouseEvent) => {
        if (event.detail === 2) {
            toggleAdminMode();
        }
    };

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

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                overflow: 'hidden',
                background: '#FAF7F2',
            }}
        >
            <DiscoveryScreen onLogoDoubleClick={handleSecretClick} />
            {!isAuthenticated && <LoginModal />}
        </div>
    );
}
