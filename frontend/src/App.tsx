import { useState } from 'react';
import { BottomNavigation } from './components/common/BottomNavigation';
import { LoginModal } from './components/common/LoginModal';
import { CurtidasScreen } from './pages/CurtidasScreen';
import { DiscoveryScreen } from './pages/DiscoveryScreen';
import { AdminDashboardScreen } from './pages/admin/AdminDashboardScreen';
import { AdminLoginScreen } from './pages/admin/AdminLoginScreen';
import { useAdminStore } from './store/useAdminStore';
import { useAuthStore } from './store/useAuthStore';

export default function App() {
    const [activeTab, setActiveTab] = useState('foryou');
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
            <nav
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    left: 0,
                    zIndex: 1100,
                    display: 'flex',
                    width: '100%',
                    maxWidth: '430px',
                    height: '45px',
                    alignItems: 'center',
                    margin: '0 auto',
                    padding: '0 15px',
                    background: '#FAF7F2',
                }}
            >
                <button
                    type="button"
                    onDoubleClick={handleSecretClick}
                    aria-label="Brechó da Cami"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: 0,
                        border: 0,
                        color: '#687152',
                        background: 'transparent',
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: '16px',
                        fontStyle: 'italic',
                        fontWeight: 600,
                        lineHeight: 0.76,
                        cursor: 'pointer',
                    }}
                >
                    <span>Brechó</span>
                    <span>da Cami</span>
                </button>
            </nav>

            <div
                className="screens"
                style={{
                    position: 'absolute',
                    top: '45px',
                    right: 0,
                    bottom: '52px',
                    left: 0,
                }}
            >
                <div style={{ height: '100%', overflow: 'hidden' }}>
                    {activeTab === 'foryou' && <DiscoveryScreen />}
                    {activeTab === 'curtidas' && <CurtidasScreen />}
                </div>
            </div>

            <BottomNavigation
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isVisible
            />

            {!isAuthenticated && <LoginModal />}
        </div>
    );
}
