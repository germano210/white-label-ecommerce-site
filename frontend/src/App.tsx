import { useState } from 'react';
import { Home } from './pages/Home';
import { DiscoveryScreen } from './pages/DiscoveryScreen';

export default function App() {
    const [activeTab, setActiveTab] = useState('inicio');

    return (
        <>
            <div className="urgency-strip">
                ✦ Frete grátis acima de <b>R$150</b> · Troca em até 7 dias garantida ✦
            </div>

            <nav>
                <div className="nav-logo">Ateliê <span>Bella</span></div>
                {/* Substituindo os ícones de livro e sino pelo botão único de História */}
                <button
                    className={`nav-icon-btn ${activeTab === 'historia' ? 'active' : ''}`}
                    onClick={() => setActiveTab('historia')}
                    style={{ width: 'auto', padding: '0 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}
                >
                    NOSSA HISTÓRIA 💛
                </button>
            </nav>

            <div className="screens">
                <div className={`screen ${activeTab === 'inicio' ? 'active' : ''}`}>
                    {activeTab === 'inicio' && <Home onNavigateParaVoce={() => setActiveTab('paravoc')} />}
                </div>

                <div className={`screen ${activeTab === 'paravoc' ? 'active' : ''}`}>
                    {activeTab === 'paravoc' && <DiscoveryScreen />}
                </div>

                <div className={`screen ${activeTab === 'carrinho' ? 'active' : ''}`}>
                    {/* Tela de Carrinho (Será construída em breve) */}
                    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                        <div style={{ fontSize: '48px' }}>🛍️</div>
                        <h2 style={{ fontFamily: 'var(--font-display)', marginTop: '10px' }}>Seu Carrinho</h2>
                        <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '8px' }}>Seus itens selecionados aparecerão aqui.</p>
                    </div>
                </div>

                <div className={`screen ${activeTab === 'historia' ? 'active' : ''}`}>
                    {/* Tela de História (Sendo refinada) */}
                    <div style={{ padding: '20px' }}>
                        <h2 style={{ fontFamily: 'var(--font-display)' }}>Nossa História</h2>
                        <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '10px' }}>Em breve: Conheça mais sobre o Ateliê Bella.</p>
                    </div>
                </div>
            </div>

            <div className="bottom-nav">
                <button className={`bnav-item ${activeTab === 'inicio' ? 'active' : ''}`} onClick={() => setActiveTab('inicio')}>
                    <span className="bnav-icon">🏠</span>
                    <span className="bnav-label">Início</span>
                    <span className="bnav-dot"></span>
                </button>
                <button className={`bnav-item ${activeTab === 'paravoc' ? 'active' : ''}`} onClick={() => setActiveTab('paravoc')}>
                    <span className="bnav-icon">✨</span>
                    <span className="bnav-label">Para Você</span>
                    <span className="bnav-dot"></span>
                </button>
                {/* Substituindo Nossa História por Carrinho no Bottom Nav */}
                <button className={`bnav-item ${activeTab === 'carrinho' ? 'active' : ''}`} onClick={() => setActiveTab('carrinho')}>
                    <span className="bnav-icon">🛍️</span>
                    <span className="bnav-label">Carrinho</span>
                    <span className="bnav-dot"></span>
                </button>
            </div>

            {/* WhatsApp flutuante inteligente */}
            {activeTab === 'inicio' && (
                <button className="sticky-wa" style={{ display: 'flex', bottom: 'calc(var(--bottom-h) + 12px)', right: '16px' }}>
                    📲 WhatsApp
                </button>
            )}
        </>
    );
}