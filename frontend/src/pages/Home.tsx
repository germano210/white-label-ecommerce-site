import { mockProducts } from '../utils/mockProducts';

interface HomeProps {
    onNavigateParaVoce: () => void;
}

export function Home({ onNavigateParaVoce }: HomeProps) {
    return (
        <div className="home-screen">
            <div className="hero-mobile">
                <span className="hero-badge">✦ Nova coleção outono 2025</span>
                <h1 className="hero-headline">A peça que você estava esperando <em>acabou de chegar</em></h1>
                <p className="hero-sub">Peças com personalidade para mulheres que sabem o que querem. Estilo sem complicação.</p>
            </div>

            <div className="hero-card">
                <div className="hero-card-text">📸<br/>Foto da vitrine</div>
                <div className="hero-card-badge">NOVO</div>
                <div className="hero-card-info">
                    <div className="hci-title">Blusa Siena · R$129</div>
                    <div className="hci-sub">⚡ Apenas 3 unidades</div>
                </div>
            </div>

            <div className="social-proof-bar">
                <div className="avatars"><div className="av">MA</div><div className="av">CL</div><div className="av">FE</div><div className="av">+</div></div>
                <span className="sp-text"><strong>312 clientes</strong> compraram essa semana</span>
            </div>

            <div className="trust-row">
                <div className="trust-chip">🚚 <strong>Entrega</strong> via motoboy</div>
                <div className="trust-chip">🔄 <strong>Troca</strong> em 7 dias</div>
                <div className="trust-chip">💬 <strong>Atendimento</strong> personalizado</div>
                <div className="trust-chip">⭐ <strong>4,9</strong> · 847 avaliações</div>
            </div>

            <div className="section-title-m">Mais desejados ✦</div>
            <div className="products-scroll">
                {mockProducts.map((p) => (
                    <div key={p.id} className="product-card-m">
                        <div className="product-img-m">
                            {p.emoji}
                            {p.badge && <span className={`badge-m ${p.badge}`}>{p.badgeText}</span>}
                        </div>
                        <div className="product-body-m">
                            <div className="product-name-m">{p.name}</div>
                            <div className="product-sub-m">{p.sub}</div>
                            <div className="product-pricing-m">
                                {p.priceOld && <span className="price-old-m">{p.priceOld}</span>}
                                <span className="price-new-m">{p.priceNew}</span>
                                {p.priceSave && <span className="price-save-m">{p.priceSave}</span>}
                            </div>
                            <button className="product-cta-m">📲 Quero esta peça</button>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ margin: '20px 16px', background: 'var(--terra)', borderRadius: '16px', padding: '20px', textAlign: 'center', color: 'white' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>✨</div>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 500, marginBottom: '6px' }}>Descobrir peças para você</p>
                <p style={{ fontSize: '12px', opacity: 0.8, marginBottom: '14px', lineHeight: 1.5 }}>Deslize para curtir ou não as peças da nossa coleção</p>
                <button
                    onClick={onNavigateParaVoce}
                    style={{ background: 'white', color: 'var(--terra)', border: 'none', padding: '11px 24px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                    Começar agora →
                </button>
            </div>

            <div className="section-title-m" style={{ marginTop: '8px' }}>O que dizem 💬</div>
            <div className="testi-scroll">
                <div className="testi-card-m"><div className="testi-stars-m">★★★★★</div><div className="testi-text-m">"Comprei a Blusa Siena e já recebi 5 elogios no trabalho. A qualidade é incrível para o preço!"</div><div className="testi-author-m">— Mariana A., Florianópolis</div></div>
                <div className="testi-card-m"><div className="testi-stars-m">★★★★★</div><div className="testi-text-m">"Atendimento maravilhoso! Me ajudaram a escolher o look perfeito para meu evento."</div><div className="testi-author-m">— Claudia F., Porto Alegre</div></div>
                <div className="testi-card-m"><div className="testi-stars-m">★★★★★</div><div className="testi-text-m">"Entrega super rápida e embalagem linda. Virei cliente fiel do Ateliê Bella!"</div><div className="testi-author-m">— Fernanda R., Curitiba</div></div>
            </div>
        </div>
    );
}