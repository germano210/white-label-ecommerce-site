import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';
import { SwipeCard } from '../components/domain/SwipeCard';
import { type ProdutoVitrine } from '../store/useCartStore';
import { useDiscoveryStore } from '../store/useDiscoveryStore';
import { api } from '../utils/api';

interface ProdutoApi {
    id: number | string;
    nome: string;
    precoVenda: number | string;
    precoAntigo?: number | string | null;
    tamanho: string;
    imagemUrl?: string | null;
    curtidasCount: number;
    passosCount: number;
    nomesCurtidas?: string[] | null;
    categoria?: string | null;
}

interface ProdutosPage {
    content?: ProdutoApi[];
}

const apiBaseUrl = String(api.defaults.baseURL ?? '').replace(/\/$/, '');

function getImageUrl(imagePath?: string | null) {
    if (!imagePath) return undefined;
    if (/^https?:\/\//i.test(imagePath)) return imagePath;
    return `${apiBaseUrl}/${imagePath.replace(/^\/+/, '')}`;
}

function parsePrice(value?: number | string | null) {
    if (typeof value === 'number') return value;
    if (!value) return 0;

    const normalizedValue = value
        .replace(/[^\d,.-]/g, '')
        .replace(/\.(?=\d{3}(?:\D|$))/g, '')
        .replace(',', '.');

    return Number(normalizedValue) || 0;
}

function formatPrice(value: number) {
    return value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

function mapProduto(produto: ProdutoApi): ProdutoVitrine {
    const price = parsePrice(produto.precoVenda);
    const oldPrice = parsePrice(produto.precoAntigo);
    const imageUrl = getImageUrl(produto.imagemUrl);

    return {
        id: String(produto.id),
        name: produto.nome,
        price,
        category: produto.categoria?.trim() || 'Todas',
        iconId: 'shirt',
        sub: '',
        tamanho: produto.tamanho || 'Único',
        curtidasCount: produto.curtidasCount,
        passosCount: produto.passosCount,
        nomesCurtidas: produto.nomesCurtidas ?? [],
        curtidas: produto.curtidasCount,
        dislikes: produto.passosCount,
        images: imageUrl ? [imageUrl] : [],
        priceNew: formatPrice(price),
        priceOld: oldPrice > 0 ? formatPrice(oldPrice) : undefined,
    };
}

export function DiscoveryScreen() {
    const activeCategory = useDiscoveryStore((state) => state.activeCategory);
    const swipeRight = useDiscoveryStore((state) => state.swipeRight);
    const swipeLeft = useDiscoveryStore((state) => state.swipeLeft);
    const undoLastSwipe = useDiscoveryStore((state) => state.undoLastSwipe);
    const matchAlertVisible = useDiscoveryStore((state) => state.matchAlertVisible);
    const dismissMatchAlert = useDiscoveryStore((state) => state.dismissMatchAlert);
    const [products, setProducts] = useState<ProdutoVitrine[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const loadProducts = useCallback(async () => {
        setIsLoading(true);
        setError('');

        try {
            const { data } = await api.get<ProdutoApi[] | ProdutosPage>('/admin/produtos');
            const apiProducts = Array.isArray(data) ? data : data.content ?? [];
            setProducts(apiProducts.map(mapProduto));
        } catch {
            setError('Não foi possível carregar as peças agora.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadProducts();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadProducts]);

    useEffect(() => {
        if (!matchAlertVisible) return;

        const timeoutId = window.setTimeout(dismissMatchAlert, 4500);
        return () => window.clearTimeout(timeoutId);
    }, [dismissMatchAlert, matchAlertVisible]);

    const displayProducts = useMemo(() => {
        if (activeCategory === 'TODAS AS PEÇAS') return products;

        const filteredProducts = products.filter(
            (product) => product.category.toLowerCase() === activeCategory.toLowerCase(),
        );

        return filteredProducts.length > 0 ? filteredProducts : products;
    }, [activeCategory, products]);

    const currentStack = useMemo(() => {
        return displayProducts.slice(0, 3);
    }, [displayProducts]);

    const handleSwipe = useCallback((
        product: ProdutoVitrine,
        direction: 'like' | 'dislike',
    ) => {
        setProducts((currentProducts) => (
            currentProducts.filter((item) => item.id !== product.id)
        ));

        switch (direction) {
            case 'dislike':
                swipeLeft(product);
                break;

            case 'like':
                swipeRight(product);
                void api.post(`/curtidas/${encodeURIComponent(product.id)}`).catch(() => {
                    // Mantém o swipe otimista para não interromper a experiência.
                });
                break;
        }
    }, [swipeLeft, swipeRight]);

    const handleUndo = useCallback(() => {
        const restoredProduct = undoLastSwipe();
        if (!restoredProduct) return;

        setProducts((currentProducts) => [
            restoredProduct,
            ...currentProducts.filter((product) => product.id !== restoredProduct.id),
        ]);
    }, [undoLastSwipe]);

    return (
        <main
            className="paravoc-screen bg-[var(--background-app)]"
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                padding: '1px 6px 12px',
                fontFamily: "'DM Sans', sans-serif",
            }}
        >
            <AnimatePresence>
                {matchAlertVisible && (
                    <motion.div
                        role="status"
                        initial={{ opacity: 0, y: -18, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -12, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                        style={{
                            position: 'absolute',
                            top: '12px',
                            right: '18px',
                            left: '18px',
                            zIndex: 100,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 14px',
                            borderRadius: 'var(--radius-card)',
                            color: 'var(--color-action-button)',
                            background: 'var(--color-success-badge)',
                            boxShadow: '0 12px 30px rgba(66, 73, 52, 0.28)',
                        }}
                    >
                        <CheckCircle2 size={22} aria-hidden="true" />
                        <strong style={{ flex: 1, fontSize: '14px' }}>
                            Conseguiste 3 Matchs! Vai à tua lista
                        </strong>
                        <button
                            type="button"
                            aria-label="Fechar aviso"
                            onClick={dismissMatchAlert}
                            style={{
                                display: 'grid',
                                width: '28px',
                                height: '28px',
                                padding: 0,
                                border: 0,
                                placeItems: 'center',
                                color: 'inherit',
                                background: 'transparent',
                                cursor: 'pointer',
                            }}
                        >
                            <X size={18} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div
                className="card-stack"
                aria-label="Peças para descobrir"
                style={{
                    position: 'relative',
                    flex: 1,
                    minHeight: 0,
                    padding: 0,
                }}
            >
                {isLoading && (
                    <DiscoveryMessage
                        title="A preparar o seu garimpo..."
                        description="Estamos buscando as peças mais recentes."
                    />
                )}

                {!isLoading && error && (
                    <DiscoveryMessage
                        title="Não conseguimos carregar as peças"
                        description={error}
                        actionLabel="Tentar novamente"
                        onAction={() => void loadProducts()}
                    />
                )}

                {!isLoading && !error && currentStack.length === 0 && (
                    <DiscoveryMessage
                        title="Novidades a caminho"
                        description="Ainda não existem peças disponíveis para descobrir."
                    />
                )}

                {!isLoading && !error && [...currentStack].reverse().map((product, index) => {
                    const stackIndex = currentStack.length - 1 - index;

                    return (
                        <SwipeCard
                            key={product.id}
                            product={product}
                            index={stackIndex}
                            isTop={stackIndex === 0}
                            onSwipe={(direction) => handleSwipe(product, direction)}
                            onUndo={handleUndo}
                        />
                    );
                })}
            </div>
        </main>
    );
}

interface DiscoveryMessageProps {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

function DiscoveryMessage({
    title,
    description,
    actionLabel,
    onAction,
}: DiscoveryMessageProps) {
    return (
        <div
            role="status"
            style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '32px',
                borderRadius: 'var(--radius-card)',
                color: 'var(--text-dark)',
                background: '#F2EEE7',
                textAlign: 'center',
            }}
        >
            <strong style={{ fontSize: '18px' }}>{title}</strong>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                {description}
            </span>
            {actionLabel && onAction && (
                <button
                    type="button"
                    onClick={onAction}
                    style={{
                        marginTop: '6px',
                        padding: '10px 18px',
                        border: 0,
                        borderRadius: 'var(--radius-button)',
                        color: 'var(--color-action-button)',
                        background: 'var(--color-success-badge)',
                        transition: 'var(--transition-smooth)',
                        fontWeight: 700,
                        cursor: 'pointer',
                    }}
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
