import { motion } from 'framer-motion';
import {
    Grid3X3,
    Heart,
    Search,
    UserRound,
    type LucideIcon,
} from 'lucide-react';
import { useDiscoveryStore } from '../../store/useDiscoveryStore';

interface NavItem {
    id: string;
    label: string;
    icon: LucideIcon;
}

const navItems: NavItem[] = [
    { id: 'foryou', label: 'Início', icon: Grid3X3 },
    { id: 'pesquisa', label: 'Pesquisa', icon: Search },
    { id: 'curtidas', label: 'Curtidas', icon: Heart },
    { id: 'perfil', label: 'Perfil', icon: UserRound },
];

interface Props {
    activeTab: string;
    setActiveTab: (id: string) => void;
    isVisible: boolean;
}

const activeColor = 'var(--text-dark)';
const neutralColor = 'var(--text-muted)';

export function BottomNavigation({ activeTab, setActiveTab, isVisible }: Props) {
    const pulseLikes = useDiscoveryStore((state) => state.pulseLikes);

    return (
        <div
            className="bottom-nav bg-[var(--background-navbar)]"
            role="navigation"
            aria-label="Navegação principal"
            style={{
                position: 'fixed',
                right: 0,
                bottom: 0,
                left: 0,
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                maxWidth: '430px',
                height: '52px',
                margin: '0 auto',
                padding: '0 18px max(2px, env(safe-area-inset-bottom))',
                borderTop: '1px solid var(--border-subtle)',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
                transition: 'var(--transition-smooth)',
            }}
        >
            {navItems.map((item) => {
                const isActive = activeTab === item.id;
                const isLikesTab = item.id === 'curtidas';
                const shouldPulse = isLikesTab && pulseLikes;
                const Icon = item.icon;

                return (
                    <button
                        key={item.id}
                        type="button"
                        title={item.label}
                        aria-label={item.label}
                        aria-current={isActive ? 'page' : undefined}
                        onClick={() => setActiveTab(item.id)}
                        style={{
                            position: 'relative',
                            display: 'grid',
                            flex: 1,
                            height: '100%',
                            minWidth: 0,
                            placeItems: 'center',
                            padding: 0,
                            border: 0,
                            color: isActive || shouldPulse ? activeColor : neutralColor,
                            background: 'transparent',
                            cursor: 'pointer',
                        }}
                    >
                        <motion.span
                            style={{
                                position: 'relative',
                                display: 'grid',
                                width: '38px',
                                height: '38px',
                                placeItems: 'center',
                            }}
                            animate={shouldPulse
                                ? { scale: [1, 1.3, 1] }
                                : { scale: isActive ? 1.06 : 1 }}
                            transition={{ duration: 0.55, ease: 'easeInOut' }}
                        >
                            <Icon
                                size={22}
                                strokeWidth={isActive ? 2.5 : 1.8}
                                fill={isActive && (isLikesTab || item.id === 'foryou')
                                    ? 'currentColor'
                                    : 'none'}
                            />

                            {shouldPulse && (
                                <motion.span
                                    aria-hidden="true"
                                    initial={{ opacity: 0.45, scale: 0.65 }}
                                    animate={{ opacity: 0, scale: 1.65 }}
                                    transition={{ duration: 0.62 }}
                                    style={{
                                        position: 'absolute',
                                        width: '25px',
                                        height: '25px',
                                        border: `1px solid ${activeColor}`,
                                        borderRadius: 'var(--radius-button)',
                                    }}
                                />
                            )}
                        </motion.span>
                    </button>
                );
            })}
        </div>
    );
}
