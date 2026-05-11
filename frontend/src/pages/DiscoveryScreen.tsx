import { mockProducts } from '../utils/mockProducts';
import { SwipeCard } from '../components/domain/SwipeCard';
import { useDiscoveryStore } from '../store/useDiscoveryStore';

export function DiscoveryScreen() {
    const { history, likedItems, undoLastSwipe } = useDiscoveryStore();

    const currentIndex = history.length;
    const currentProduct = mockProducts[currentIndex];
    const remainingProducts = mockProducts.slice(currentIndex, currentIndex + 3);

    // Gatilho de conversão direta
    const handleWhatsApp = () => {
        if (!currentProduct) return;
        const msg = `Olá! Gostaria de separar a peça que vi no site: ${currentProduct.name} - ${currentProduct.priceNew}`;
        window.open(`https://wa.me/5551999999999?text=${encodeURIComponent(msg)}`, '_blank');
    };

    return (
        <div className="paravoc-screen" style={{ width: '100%', height: '100%' }}>

            <div className="pv-topbar">
                <span className="pv-title">Para Você ✨</span>
                <span className="pv-counter">
          {Math.min(currentIndex + 1, mockProducts.length)} / {mockProducts.length}
        </span>
            </div>

            <div className="card-stack">
                {remainingProducts.length > 0 ? (
                    [...remainingProducts].reverse().map((product, index) => (
                        <SwipeCard
                            key={product.id}
                            product={product}
                            index={remainingProducts.length - 1 - index}
                            isTop={index === remainingProducts.length - 1}
                            onSwipeEnd={() => {}}
                        />
                    ))
                ) : (
                    <div className="pv-empty">
                        <div className="pv-empty-icon">🎉</div>
                        <div className="pv-empty-title">Você viu tudo!</div>
                        <div className="pv-empty-sub">
                            Você salvou {likedItems.length} peça{likedItems.length !== 1 && 's'} que amou.<br/>
                            Fale pelo WhatsApp para garantir as suas!
                        </div>
                        <button
                            onClick={() => window.open('https://wa.me/5551999999999', '_blank')}
                            className="pv-empty-btn" style={{ background: 'var(--dark)', marginTop: '8px' }}
                        >
                            📲 Pedir pelo WhatsApp
                        </button>
                    </div>
                )}
            </div>

            <div className="pv-actions">
                <button className="pv-btn pv-btn-undo" onClick={undoLastSwipe}>
                    <div className="pv-btn-circle">↩️</div>
                    <span className="pv-btn-label">Voltar</span>
                </button>

                <div className="pv-price-center">
                    <div className="pv-price-label">preço</div>
                    <div className="pv-price-old">{currentProduct?.priceOld || ''}</div>
                    <div className="pv-price-new">{currentProduct?.priceNew || '—'}</div>
                    <div className="pv-price-save">{currentProduct?.priceSave || ''}</div>
                </div>

                {/* Botão de Separar (WhatsApp Direto) adaptado para o seu modelo */}
                <button className="pv-btn pv-btn-save" onClick={handleWhatsApp}>
                    <div className="pv-btn-circle" style={{ background: 'var(--terra)', color: 'white', border: 'none' }}>
                        📲
                    </div>
                    <span className="pv-btn-label">Separar</span>
                </button>
            </div>

        </div>
    );
}