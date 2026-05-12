import { motion } from 'framer-motion'; // Importamos o motion
import { Search, Heart } from 'lucide-react';
import { useDiscoveryStore } from '../../store/useDiscoveryStore'; // Importamos a store

interface NavItem {
    id: string;
    label: string;
    icon: any;
}

const navItems: NavItem[] = [
    { id: 'foryou', label: 'For You', icon: Search },
    { id: 'curtidas', label: 'Curtidas', icon: Heart },
];

interface Props {
    activeTab: string;
    setActiveTab: (id: string) => void;
    isVisible: boolean;
}

export function BottomNavigation({ activeTab, setActiveTab, isVisible }: Props) {
    // Escuta o estado de pulso da store
    const pulseLikes = useDiscoveryStore((state) => state.pulseLikes);

    return (
        <div
            className="bottom-nav"
            style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
                transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
                opacity: isVisible ? 1 : 0,
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex', alignItems: 'center', padding: '0 20px', height: '72px',
                background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(14px)',
                borderTop: '0.5px solid #EEEEEE', maxWidth: '430px', margin: '0 auto'
            }}
        >
            {navItems.map((item) => {
                const isLikesTab = item.id === 'curtidas';

                return (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        style={{
                            flex: 1, border: 'none', background: 'none',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', gap: '4px', cursor: 'pointer',
                            position: 'relative' // Para o pulso ficar centralizado
                        }}
                    >
                        {/* Contentor Animado para o Ícone */}
                        <motion.div
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: '40px', height: '40px', borderRadius: '50%',
                                position: 'relative', zIndex: 2
                            }}
                            // ANIMAÇÃO DE PULSO: Ativa quando pulseLikes for true na aba Curtidas
                            animate={isLikesTab && pulseLikes ? {
                                scale: [1, 1.4, 1], // Aumenta e diminui
                                background: ['rgba(255,255,255,0)', 'rgba(255,255,255,1)', 'rgba(255,255,255,0)'], // Fundo branco temporário
                            } : { scale: 1, background: 'rgba(255,255,255,0)' }}
                            transition={{ duration: 0.6, ease: "easeInOut" }}
                        >
                            <item.icon
                                size={24}
                                strokeWidth={activeTab === item.id ? 2.5 : 1.5}
                                // Se estiver a pulsar, a cor fica mais forte (var(--terra))
                                color={(activeTab === item.id || (isLikesTab && pulseLikes)) ? 'var(--terra)' : '#999999'}
                            />
                        </motion.div>

                        <span style={{
                            fontSize: '10px', fontFamily: 'var(--font-body)',
                            fontWeight: activeTab === item.id ? 700 : 500,
                            color: activeTab === item.id ? 'var(--terra)' : '#999999',
                            zIndex: 2
                        }}>
                            {item.label}
                        </span>

                        {activeTab === item.id && (
                            <div style={{
                                width: '4px', height: '4px', borderRadius: '50%',
                                background: 'var(--terra)', marginTop: '2px'
                            }} />
                        )}
                    </button>
                );
            })}
        </div>
    );
}