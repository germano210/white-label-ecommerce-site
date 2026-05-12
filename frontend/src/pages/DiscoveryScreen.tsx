import { mockProducts } from '../utils/mockProducts';
import { SwipeCard } from '../components/domain/SwipeCard';
import { useDiscoveryStore } from '../store/useDiscoveryStore';

export function DiscoveryScreen() {
    const { history, activeCategory } = useDiscoveryStore();

    // Lógica de Filtragem conectada à Store
    const filteredProducts = activeCategory === 'TODAS AS PEÇAS'
        ? mockProducts
        : mockProducts.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase());

    // Trava de segurança para não quebrar se a categoria estiver vazia
    const displayProducts = filteredProducts.length > 0 ? filteredProducts : mockProducts;

    const startIndex = history.length % displayProducts.length;

    const currentStack = [
        displayProducts[startIndex],
        displayProducts[(startIndex + 1) % displayProducts.length],
        displayProducts[(startIndex + 2) % displayProducts.length],
    ];

    return (
        <div className="paravoc-screen" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--cream)' }}>

            {/* Removido o menu antigo. Agora os cartões ocupam todo o espaço com uma leve margem no topo */}
            <div className="card-stack" style={{ flex: 1, position: 'relative', padding: '16px 16px 20px' }}>
                {[...currentStack].reverse().map((product, index) => {
                    const stackIndex = currentStack.length - 1 - index;
                    return (
                        <SwipeCard
                            key={`${product.id}-${history.length + stackIndex}`}
                            product={product}
                            index={stackIndex}
                            isTop={stackIndex === 0}
                            onSwipeEnd={() => {}}
                        />
                    );
                })}
            </div>

        </div>
    );
}