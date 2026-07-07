import { useEffect, useMemo, useState } from 'react';
import { Heart, Send } from 'lucide-react';
import { useDiscoveryStore } from '../store/useDiscoveryStore';
import { getImageUrl } from '../utils/imageUtils';

interface HomeProps {
    onNavigateParaVoce: () => void;
}

export function Home({ onNavigateParaVoce }: HomeProps) {
    const [activeSlide, setActiveSlide] = useState(0);
    const products = useDiscoveryStore((state) => state.products);
    const isLoading = useDiscoveryStore((state) => state.isLoading);
    const error = useDiscoveryStore((state) => state.error);
    const fetchProdutos = useDiscoveryStore((state) => state.fetchProdutos);
    const heroProducts = useMemo(() => products.slice(0, 3), [products]);
    const totalSlides = Math.max(heroProducts.length, 1);
    const activeProduct = heroProducts[Math.min(activeSlide, Math.max(heroProducts.length - 1, 0))]
        ?? products[0];

    useEffect(() => {
        void fetchProdutos();
    }, [fetchProdutos]);

    const handleCarouselScroll = (event: React.UIEvent<HTMLDivElement>) => {
        const slideIndex = Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth);
        setActiveSlide(slideIndex);
    };

    return (
        <div className="home-screen" style={{ padding: 0 }}>
            <div style={{ padding: '20px 16px 16px' }}>
                <div style={{
                    background: 'var(--soft)',
                    color: 'var(--terra)',
                    padding: '6px 14px',
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    borderRadius: '20px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginBottom: '16px',
                }}>
                    NOVAS PECAS DA LOJA
                </div>

                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 500, lineHeight: '1.1', color: 'var(--dark)' }}>
                    Pecas com mais<br />
                    <em style={{ color: 'var(--terra)', fontStyle: 'italic', fontFamily: 'var(--font-display)', fontWeight: 600 }}>movimento agora</em>
                </h1>
            </div>

            <div style={{ margin: '0 16px 30px', background: 'white', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 12px 30px rgba(0,0,0,0.06)' }}>
                <div style={{ position: 'relative', height: '480px', background: '#1A1A1A' }}>
                    <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        right: '12px',
                        background: 'white',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        zIndex: 20,
                        textAlign: 'center',
                        fontSize: '10px',
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}>
                        {activeProduct ? (
                            <>
                                <span style={{ color: 'var(--terra)' }}>{activeProduct.name}</span>
                                {' ja recebeu '}
                                <span style={{ color: 'var(--terra)' }}>{activeProduct.curtidasCount}</span>
                                {' curtidas.'}
                            </>
                        ) : (
                            'Carregando produtos reais da loja.'
                        )}
                    </div>

                    <div
                        onScroll={handleCarouselScroll}
                        style={{ display: 'flex', overflowX: 'auto', height: '100%', width: '100%', scrollSnapType: 'x mandatory', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                    >
                        {heroProducts.length > 0 ? heroProducts.map((product) => (
                            <div key={product.id} style={{ minWidth: '100%', height: '100%', background: '#E8E3DA', display: 'flex', alignItems: 'center', justifyContent: 'center', scrollSnapAlign: 'center', scrollSnapStop: 'always' }}>
                                <img src={getImageUrl(product.images?.[0])} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        )) : (
                            <div style={{ minWidth: '100%', height: '100%', background: '#E8E3DA', display: 'flex', alignItems: 'center', justifyContent: 'center', scrollSnapAlign: 'center', scrollSnapStop: 'always', color: 'var(--muted)', fontSize: '14px', fontWeight: 700 }}>
                                {isLoading ? 'Carregando pecas...' : 'Nenhuma peca disponivel'}
                            </div>
                        )}
                    </div>

                    <div style={{ position: 'absolute', bottom: '20px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '24px', zIndex: 20 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                            <button style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FF3B30', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(255, 59, 48, 0.4)' }}>
                                <Heart size={24} strokeWidth={2} color="white" />
                            </button>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>{activeProduct?.curtidasCount ?? 0}</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                            <button style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                                <Send size={24} strokeWidth={2} color="var(--dark)" style={{ transform: 'rotate(-30deg) translateX(-2px)' }} />
                            </button>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>{activeProduct?.passosCount ?? 0}</span>
                        </div>
                    </div>

                    <div style={{ position: 'absolute', bottom: '26px', right: '16px', zIndex: 20 }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'white' }}>
                            {Math.min(activeSlide + 1, totalSlides)} de {totalSlides}
                        </span>
                    </div>
                </div>

                <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                    <h3 className="font-display" style={{ fontSize: '22px', fontWeight: 600, color: 'var(--dark)', marginBottom: '4px' }}>
                        {activeProduct?.name ?? 'Produtos da loja'}
                    </h3>
                    <div style={{ fontSize: '14px', color: 'var(--dark)', marginBottom: '16px', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
                        {activeProduct?.priceOld && <span style={{ textDecoration: 'line-through' }}>{activeProduct.priceOld}</span>}
                        <strong style={{ fontSize: '15px' }}>{activeProduct?.priceNew ?? '--'}</strong>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.02em' }}>
                        {activeProduct ? `${activeProduct.category} · Tam. ${activeProduct.tamanho}` : 'Aguardando produtos reais'}
                    </div>
                </div>
            </div>

            <div style={{ background: 'var(--cream)', paddingBottom: '110px' }}>
                <div className="section-title-m" style={{ marginTop: '10px' }}>Mais desejados</div>

                {error && (
                    <div style={{ margin: '0 16px', padding: '14px', borderRadius: '14px', background: '#FFF0ED', color: '#A63D2F', fontSize: '13px', fontWeight: 700 }}>
                        {error}
                    </div>
                )}

                <div className="products-scroll">
                    {products.map((product) => (
                        <div key={product.id} className="product-card-m">
                            <div className="product-img-m">
                                <img src={getImageUrl(product.images?.[0])} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div className="product-body-m">
                                <div className="product-name-m">{product.name}</div>
                                <div className="product-pricing-m">
                                    {product.priceOld && <span className="price-old-m" style={{ color: 'var(--dark)', textDecoration: 'line-through' }}>{product.priceOld}</span>}
                                    <span className="price-new-m" style={{ color: 'var(--dark)' }}>{product.priceNew}</span>
                                </div>
                                <button className="product-cta-m" onClick={onNavigateParaVoce}>Ver peca</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ margin: '30px 16px', background: 'var(--terra)', borderRadius: '20px', padding: '30px 20px', textAlign: 'center', color: 'white', boxShadow: '0 10px 24px rgba(230, 57, 143, 0.2)' }}>
                    <p className="font-display" style={{ fontSize: '22px', fontWeight: 500, marginBottom: '10px' }}>Modo Descoberta</p>
                    <p style={{ fontSize: '13px', opacity: 0.9, marginBottom: '20px', lineHeight: 1.6 }}>Encontre o look perfeito deslizando para os lados.</p>
                    <button
                        onClick={onNavigateParaVoce}
                        style={{ background: 'white', color: 'var(--terra)', border: 'none', padding: '14px 30px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                    >
                        Comecar agora
                    </button>
                </div>
            </div>
        </div>
    );
}
