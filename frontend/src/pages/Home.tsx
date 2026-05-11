import { useState } from 'react';
import { mockProducts } from '../utils/mockProducts';
import { getProductIcon } from '../utils/iconMap';
import { Heart, Bookmark, Send } from 'lucide-react';

interface HomeProps {
    onNavigateParaVoce: () => void;
}

export function Home({ onNavigateParaVoce }: HomeProps) {
    // Estado para controlar qual imagem do carrossel está ativa (para os pontinhos)
    const [activeSlide, setActiveSlide] = useState(0);

    // Função que atualiza o pontinho branco com base no scroll
    const handleCarouselScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const slideIndex = Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth);
        setActiveSlide(slideIndex);
    };

    return (
        <div className="home-screen" style={{ padding: 0 }}>

            {/* =======================================================
          HERO SOCIAL (Estilo Insta/Tinder)
          ======================================================= */}
            <div style={{ padding: '20px 16px 16px' }}>
                <div style={{
                    background: '#F4EBE1',
                    color: 'var(--terra)',
                    padding: '6px 14px',
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    borderRadius: '20px',
                    display: 'inline-block',
                    marginBottom: '16px'
                }}>
                    ✦ NOVA COLEÇÃO DE OUTONO
                </div>

                {/* Título com a fonte de luxo forçada */}
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 500, lineHeight: '1.1', color: 'var(--dark)' }}>
                    Peças com mais<br/>
                    <em style={{ color: 'var(--terra)', fontStyle: 'italic', fontFamily: 'var(--font-display)', fontWeight: 600 }}>likes de maio!</em>
                </h1>
            </div>

            {/* Cartão de Publicação (Com Carrossel e Card de Likes) */}
            <div style={{ margin: '0 16px 30px', background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 12px 30px rgba(28,15,6,0.08)' }}>

                {/* PARTE 1: Container Relativo (Fundo escuro para a foto) */}
                <div style={{ position: 'relative', height: '480px', background: '#1C0F06' }}>

                    {/* Card Flutuante Topo: Prova Social */}
                    <div style={{
                        position: 'absolute', top: '12px', left: '12px', right: '12px',
                        background: 'white', padding: '10px 12px', borderRadius: '8px',
                        zIndex: 20, textAlign: 'center', fontSize: '10px', fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                        <span style={{ color: '#D81B60' }}>Giovanna, Maria, Bianca, Ana, Gabriela</span> e outras 22 pessoas deram <span style={{ color: '#D81B60' }}>amei!</span>
                    </div>

                    {/* O Carrossel (Swipe horizontal magnético) */}
                    <div
                        onScroll={handleCarouselScroll}
                        style={{
                            display: 'flex', overflowX: 'auto', height: '100%', width: '100%',
                            scrollSnapType: 'x mandatory', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch'
                        }}
                    >
                        {/* Slide 1 */}
                        <div style={{ minWidth: '100%', height: '100%', background: 'linear-gradient(145deg, #E2D5C5, #C8B8A0)', display: 'flex', alignItems: 'center', justifyContent: 'center', scrollSnapAlign: 'center' }}>
                            <div style={{ fontSize: '64px', opacity: 0.5 }}>📸 1</div>
                        </div>
                        {/* Slide 2 */}
                        <div style={{ minWidth: '100%', height: '100%', background: 'linear-gradient(145deg, #D4C4B0, #B3A086)', display: 'flex', alignItems: 'center', justifyContent: 'center', scrollSnapAlign: 'center' }}>
                            <div style={{ fontSize: '64px', opacity: 0.5 }}>📸 2</div>
                        </div>
                        {/* Slide 3 */}
                        <div style={{ minWidth: '100%', height: '100%', background: 'linear-gradient(145deg, #C8B8A0, #E2D5C5)', display: 'flex', alignItems: 'center', justifyContent: 'center', scrollSnapAlign: 'center' }}>
                            <div style={{ fontSize: '64px', opacity: 0.5 }}>📸 3</div>
                        </div>
                    </div>

                    {/* Overlay Lateral: Ações do Instagram */}
                    <div style={{ position: 'absolute', right: '16px', bottom: '40px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', zIndex: 20 }}>
                        <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                            <Heart size={26} strokeWidth={1.5} />
                            <span style={{ fontSize: '11px', fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>37</span>
                        </button>
                        <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                            <Bookmark size={26} strokeWidth={1.5} />
                            <span style={{ fontSize: '11px', fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>22</span>
                        </button>
                        <button style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                            <Send size={24} strokeWidth={1.5} style={{ transform: 'rotate(-30deg)' }} />
                            <span style={{ fontSize: '11px', fontWeight: 600, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>12</span>
                        </button>
                    </div>

                    {/* Pontinhos do Carrossel (Dots) */}
                    <div style={{ position: 'absolute', bottom: '16px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '6px', zIndex: 20 }}>
                        {[0, 1, 2].map((idx) => (
                            <div key={idx} style={{
                                width: '6px', height: '6px', borderRadius: '50%',
                                background: activeSlide === idx ? 'white' : 'transparent',
                                border: '1px solid white', transition: 'background 0.3s ease'
                            }} />
                        ))}
                    </div>
                </div>

                {/* PARTE 2: "Legenda" - Informações e Botão Pink */}
                <div style={{ padding: '20px 16px', textAlign: 'center' }}>
                    <h3 className="font-display" style={{ fontSize: '22px', fontWeight: 600, color: 'var(--dark)', marginBottom: '4px' }}>Blusa mula manca</h3>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px' }}>
                        de <span style={{ textDecoration: 'line-through' }}>R$119,90</span> por <strong style={{ color: 'var(--dark)', fontSize: '14px' }}>R$79,90</strong>
                    </div>
                    <button
                        onClick={() => window.open('https://wa.me/5551999999999?text=Olá!%20Quero%20a%20Blusa%20mula%20manca%20por%2079,90', '_blank')}
                        style={{ width: '100%', background: '#D81B60', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(216, 27, 96, 0.3)' }}
                    >
                        Ver no Zap!
                    </button>
                </div>
            </div>

            {/* =======================================================
          RESTANTE DO SITE
          ======================================================= */}
            <div style={{ background: 'var(--cream)', paddingBottom: '30px' }}>
                <div className="trust-row" style={{ padding: '0 16px' }}>
                    <div className="trust-chip">🚚 <strong>Entrega</strong> rápida</div>
                    <div className="trust-chip">🔄 <strong>Troca</strong> em 7 dias</div>
                    <div className="trust-chip">⭐ <strong>4,9</strong> de 5</div>
                </div>

                <div className="section-title-m" style={{ marginTop: '30px' }}>Mais desejados ✦</div>
                <div className="products-scroll">
                    {mockProducts.map((p) => (
                        <div key={p.id} className="product-card-m">
                            <div className="product-img-m">
                                {getProductIcon(p.iconId, 48)}
                                {p.badge && <span className={`badge-m ${p.badge}`}>{p.badgeText}</span>}
                            </div>
                            <div className="product-body-m">
                                <div className="product-name-m">{p.name}</div>
                                <div className="product-pricing-m">
                                    {p.priceOld && <span className="price-old-m">{p.priceOld}</span>}
                                    <span className="price-new-m">{p.priceNew}</span>
                                </div>
                                <button className="product-cta-m">📲 Ver Peça</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ margin: '30px 16px', background: 'var(--terra)', borderRadius: '20px', padding: '30px 20px', textAlign: 'center', color: 'white' }}>
                    <div style={{ fontSize: '32px', marginBottom: '10px' }}>✨</div>
                    <p className="font-display" style={{ fontSize: '22px', fontWeight: 500, marginBottom: '10px' }}>Modo Descoberta</p>
                    <p style={{ fontSize: '13px', opacity: 0.8, marginBottom: '20px', lineHeight: 1.6 }}>Encontre o look perfeito deslizando para os lados.</p>
                    <button
                        onClick={onNavigateParaVoce}
                        style={{ background: 'white', color: 'var(--terra)', border: 'none', padding: '14px 30px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                    >
                        Começar agora →
                    </button>
                </div>
            </div>
        </div>
    );
}