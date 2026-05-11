import { useState, useEffect, useRef } from 'react';
import { Home } from './pages/Home';
import { DiscoveryScreen } from './pages/DiscoveryScreen';
import { BottomNavigation } from './components/common/BottomNavigation';

export default function App() {
    const [activeTab, setActiveTab] = useState('inicio');
    const [isScrolled, setIsScrolled] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (scrollContainerRef.current) {
                const scrollTop = scrollContainerRef.current.scrollTop;
                setIsScrolled(scrollTop > 50);
            }
        };

        const currentRef = scrollContainerRef.current;
        if (currentRef) {
            currentRef.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (currentRef) currentRef.removeEventListener('scroll', handleScroll);
        };
    }, [activeTab]);

    // Lógica para saber se a barra inferior está ocupando espaço
    const isNavVisible = isScrolled || activeTab !== 'inicio';

    return (
        <div style={{ background: 'var(--cream)', height: '100vh', width: '100vw', position: 'fixed', overflow: 'hidden' }}>

            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1100,
                background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', padding: '0 16px', height: '60px',
                maxWidth: '430px', margin: '0 auto'
            }}>
                <div className="nav-logo" style={{ flex: 1, fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 600, color: 'var(--dark)' }}>
                    Via <span style={{ color: 'var(--terra)' }}>Brás</span>
                </div>
            </nav>

            {/* ÁREA DE TELAS: Agora com margem dinâmica no fundo para não esconder conteúdo */}
            <div className="screens" style={{
                position: 'absolute',
                top: '60px',
                left: 0,
                right: 0,
                bottom: isNavVisible ? '72px' : 0, // Se a nav aparecer, as telas sobem 72px
                transition: 'bottom 0.4s ease'
            }}>
                <div
                    ref={scrollContainerRef}
                    style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}
                >
                    {activeTab === 'inicio' && <Home onNavigateParaVoce={() => setActiveTab('paravoc')} />}

                    {activeTab === 'paravoc' && <DiscoveryScreen />}

                    {activeTab === 'carrinho' && (
                        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                            <div style={{ fontSize: '48px' }}>🛍️</div>
                            <h2 style={{ fontFamily: 'var(--font-display)', marginTop: '10px' }}>Seu Carrinho</h2>
                            <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '15px', background: 'var(--soft)', padding: '12px', borderRadius: '8px' }}>
                                ✦ Ganhe <b>Frete Grátis</b> em compras acima de R$150!
                            </p>
                            <p style={{ marginTop: '20px' }}>Carrinho vazio</p>
                        </div>
                    )}
                </div>
            </div>

            <BottomNavigation
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isVisible={isNavVisible}
            />
        </div>
    );
}