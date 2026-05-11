import { mockProducts } from '../utils/mockProducts';
import { SwipeCard } from '../components/domain/SwipeCard';
import { useDiscoveryStore } from '../store/useDiscoveryStore';

export function DiscoveryScreen() {
    const { history } = useDiscoveryStore();

    // O segredo do Loop Infinito: Usar o resto da divisão (%)
    const startIndex = history.length % mockProducts.length;

    // Garantimos que a pilha tem sempre 3 cartas prontas para o swipe
    const currentStack = [
        mockProducts[startIndex],
        mockProducts[(startIndex + 1) % mockProducts.length],
        mockProducts[(startIndex + 2) % mockProducts.length],
    ];

    return (
        <div className="paravoc-screen" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--cream)' }}>

            {/* Barra de Topo Centralizada (usando Flexbox) e sem o emoji */}
            <div className="pv-topbar" style={{ padding: '15px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <span className="pv-title" style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 600, color: 'var(--dark)' }}>
          Para Você
        </span>
            </div>

            <div className="card-stack" style={{ flex: 1, position: 'relative', padding: '10px 16px 20px' }}>
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