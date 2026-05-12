import { useState } from 'react';
import { DiscoveryScreen } from './pages/DiscoveryScreen';
import { CurtidasScreen } from './pages/CurtidasScreen'; // Importado
import { BottomNavigation } from './components/common/BottomNavigation';
import { useDiscoveryStore } from './store/useDiscoveryStore';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function App() {
    const [activeTab, setActiveTab] = useState('foryou');
    const { activeCategory, setActiveCategory } = useDiscoveryStore();
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);

    const categories = ['TODAS AS PEÇAS', 'Calças', 'Casacos', 'Moletons', 'Blusas', 'Saias', 'Conjuntos'];

    return (
        <div style={{ background: 'var(--cream)', position: 'fixed', top: 0, bottom: 0, left: 0, right: 0, overflow: 'hidden' }}>

            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1100,
                background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 16px', height: '60px', maxWidth: '430px', margin: '0 auto'
            }}>
                <div className="nav-logo" style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 600, color: 'var(--dark)' }}>
                    Via <span style={{ color: 'var(--terra)' }}>Brás</span>
                </div>

                {activeTab === 'foryou' && (
                    <button
                        onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                        style={{
                            background: 'var(--soft)', color: 'var(--terra)', padding: '6px 14px',
                            borderRadius: '20px', fontSize: '10px', fontWeight: 700, border: 'none',
                            display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                            fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}
                    >
                        <span style={{ fontSize: '12px', lineHeight: 0 }}>✦</span>
                        {activeCategory}
                        {isCategoryOpen ? <ChevronUp size={14} strokeWidth={2.5} /> : <ChevronDown size={14} strokeWidth={2.5} />}
                    </button>
                )}
            </nav>

            {isCategoryOpen && activeTab === 'foryou' && (
                <div style={{
                    position: 'absolute', top: '60px', left: 0, right: 0, zIndex: 1050,
                    background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)',
                    borderBottom: '1px solid var(--soft)', padding: '12px 16px',
                    display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none',
                    WebkitOverflowScrolling: 'touch', maxWidth: '430px', margin: '0 auto'
                }}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => {
                                setActiveCategory(cat);
                                setIsCategoryOpen(false);
                            }}
                            style={{
                                whiteSpace: 'nowrap', background: activeCategory === cat ? 'var(--terra)' : 'white',
                                color: activeCategory === cat ? 'white' : 'var(--terra)',
                                border: `1px solid ${activeCategory === cat ? 'var(--terra)' : 'var(--soft)'}`,
                                padding: '6px 14px', borderRadius: '16px', fontSize: '10px', fontWeight: 700,
                                cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.2s ease',
                                boxShadow: activeCategory === cat ? '0 4px 12px rgba(230, 57, 143, 0.2)' : 'none'
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            <div className="screens" style={{ position: 'absolute', top: '60px', left: 0, right: 0, bottom: '72px' }}>
                <div style={{ height: '100%', overflow: 'hidden' }}>

                    {activeTab === 'foryou' && <DiscoveryScreen />}

                    {/* Renderizamos a nova tela aqui! */}
                    {activeTab === 'curtidas' && <CurtidasScreen />}

                </div>
            </div>

            <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} isVisible={true} />
        </div>
    );
}