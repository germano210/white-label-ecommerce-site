import { type LucideIcon, Home, Search, ShoppingCart } from 'lucide-react';

interface NavItem {
    id: string;
    label: string;
    icon: LucideIcon;
}

const navItems: NavItem[] = [
    { id: 'inicio', label: 'Início', icon: Home },
    { id: 'paravoc', label: 'Para Você', icon: Search },
    { id: 'carrinho', label: 'Carrinho', icon: ShoppingCart },
];

interface Props {
    activeTab: string;
    setActiveTab: (id: string) => void;
    isVisible: boolean; // Nova propriedade para controlar a animação
}

export function BottomNavigation({ activeTab, setActiveTab, isVisible }: Props) {
    return (
        <div
            className="bottom-nav"
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
                // Lógica de "Subir": Se não visível, desce 100% (some da tela)
                transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
                opacity: isVisible ? 1 : 0,
                transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease',
                display: 'flex',
                alignItems: 'center',
                padding: '0 8px 8px',
                height: '72px',
                background: 'rgba(250, 247, 242, 0.97)',
                backdropFilter: 'blur(14px)',
                borderTop: '0.5px solid #D9D0C4',
                maxWidth: '430px',
                margin: '0 auto'
            }}
        >
            {navItems.map((item) => (
                <button
                    key={item.id}
                    className={`bnav-item ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(item.id)}
                    style={{ flex: 1, border: 'none', background: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                >
                    <span className="bnav-icon">
                        <item.icon
                            size={22}
                            strokeWidth={1.5}
                            color={activeTab === item.id ? 'var(--terra)' : 'var(--muted)'}
                        />
                    </span>
                    <span className="bnav-label" style={{ fontSize: '10px', fontWeight: 500, color: activeTab === item.id ? 'var(--terra)' : 'var(--muted)' }}>
                        {item.label}
                    </span>
                    {activeTab === item.id && <span className="bnav-dot" style={{ display: 'block', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--terra)' }}></span>}
                </button>
            ))}
        </div>
    );
}