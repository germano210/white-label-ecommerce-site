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
                // A barra inferior só sobe após 50px de scroll
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

    return (
        <div style={{ background: 'var(--cream)', minHeight: '100vh', position: 'relative' }}>

            {/* NAVBAR SUPERIOR: Fundo branco translúcido */}
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

            {/* O conteúdo agora começa abaixo da Navbar (top: 60px) */}
            <div className="screens" style={{ position: 'absolute', inset: 0, top: '60px' }}>
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

                    {activeTab === 'historia' && (
                        <div style={{ padding: '40px 20px' }}>
                            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px' }}>Nossa História</h2>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Navigation com lógica de "Subir" ao scrollar */}
            <BottomNavigation
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isVisible={isScrolled || activeTab !== 'inicio'}
            />
        </div>
    );
}