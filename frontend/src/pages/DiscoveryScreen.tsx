import { mockProducts } from '../utils/mockProducts';
import { SwipeCard } from '../components/domain/SwipeCard';
import { useDiscoveryStore } from '../store/useDiscoveryStore';

export function DiscoveryScreen() {
    const { history, likedItems } = useDiscoveryStore();

    const currentIndex = history.length;
    const remainingProducts = mockProducts.slice(currentIndex, currentIndex + 3);

    return (
        <div className="paravoc-screen" style={{ width: '100%', height: 'calc(100% - 80px)', display: 'flex', flexDirection: 'column' }}>

            {/* Barra de Topo */}
            <div className="pv-topbar">
                <span className="pv-title">Para Você ✨</span>
                <span className="pv-counter">
          {Math.min(currentIndex + 1, mockProducts.length)} / {mockProducts.length}
        </span>
            </div>

            {/* Pilha de Cartões (Ocupa todo o resto do espaço) */}
            <div className="card-stack" style={{ flex: 1, paddingBottom: '20px' }}>
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
                            Vá para o <strong>Carrinho</strong> para garanti-las!
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}