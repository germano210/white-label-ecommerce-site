import { motion, useMotionValue, useTransform, useAnimation, type PanInfo } from 'framer-motion';
import { type ProdutoVitrine } from '../../store/useCartStore';
import { useDiscoveryStore } from '../../store/useDiscoveryStore';
import { getProductIcon } from '../../utils/iconMap';
import { Undo2, X, Heart } from 'lucide-react';

interface SwipeCardProps {
    product: ProdutoVitrine;
    isTop: boolean;
    index: number;
    onSwipeEnd: () => void;
}

export function SwipeCard({ product, isTop, index, onSwipeEnd }: SwipeCardProps) {
    const swipeRight = useDiscoveryStore((state) => state.swipeRight);
    const swipeLeft = useDiscoveryStore((state) => state.swipeLeft);
    const undoLastSwipe = useDiscoveryStore((state) => state.undoLastSwipe);

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-28, 28]);
    const opacityLike = useTransform(x, [50, 150], [0, 1]);
    const opacityNope = useTransform(x, [-50, -150], [0, 1]);

    const controls = useAnimation();

    const scale = isTop ? 1 : 1 - (index * 0.04);
    const yOffset = isTop ? 0 : index * 10;

    const handleDragEnd = async (_event: any, info: PanInfo) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;

        if (offset > 100 || velocity > 500) await triggerSwipe('like');
        else if (offset < -100 || velocity < -500) await triggerSwipe('nope');
        else controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    };

    const triggerSwipe = async (type: 'like' | 'nope') => {
        const xOut = type === 'like' ? window.innerWidth : -window.innerWidth;
        await controls.start({ x: xOut, transition: { duration: 0.3 } });
        if (type === 'like') swipeRight(product);
        else swipeLeft(product);
        onSwipeEnd();
    };

    return (
        <motion.div
            className={`swipe-card ${isTop ? 'on-top' : ''}`}
            style={{
                x, rotate, scale, y: yOffset, zIndex: isTop ? 10 : 10 - index,
                // CORREÇÃO: Força o cartão a respeitar os limites absolutos do pai
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex', flexDirection: 'column',
                background: 'white', borderRadius: '24px', overflow: 'hidden',
                boxShadow: '0 8px 30px rgba(0,0,0,0.08)'
            }}
            animate={controls}
            drag={isTop ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            whileTap={{ cursor: 'grabbing' }}
        >
            <motion.div style={{ opacity: opacityLike }} className="card-overlay-like">AMEI ✓</motion.div>
            <motion.div style={{ opacity: opacityNope }} className="card-overlay-nope">NÃO ✗</motion.div>

            {/* ÁREA DA IMAGEM: flex: 1 com minHeight: 0 faz com que ela se esmague se a tela for pequena */}
            <div className="card-img" style={{ position: 'relative', flex: 1, minHeight: 0, background: 'linear-gradient(145deg, var(--soft), #FCE4EC)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <div style={{ opacity: 0.5, transform: 'scale(1.5)' }}>
                    {getProductIcon(product.iconId, 120)}
                </div>
                {product.badge && <span className={`card-badge ${product.badge}`}>{product.badgeText}</span>}

                {isTop && (
                    <div style={{ position: 'absolute', bottom: '20px', left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', zIndex: 30 }}>
                        <button onClick={(e) => { e.stopPropagation(); undoLastSwipe(); }} style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: 'none', cursor: 'pointer', color: 'var(--gold)' }}>
                            <Undo2 size={24} strokeWidth={2.5} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); triggerSwipe('nope'); }} style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: 'none', cursor: 'pointer', color: 'var(--dark)' }}>
                            <X size={32} strokeWidth={2.5} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); triggerSwipe('like'); }} style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: 'none', cursor: 'pointer', color: 'var(--terra)' }}>
                            <Heart size={32} strokeWidth={2.5} />
                        </button>
                    </div>
                )}
            </div>

            {/* ÁREA DE INFORMAÇÕES: flexShrink: 0 garante que esta área nunca seja cortada/espremida */}
            <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'white' }}>
                <div>
                    <h3 className="font-display" style={{ fontSize: '24px', fontWeight: 600, color: 'var(--dark)', marginBottom: '4px', lineHeight: 1 }}>{product.name}</h3>
                    <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{product.sub}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    {product.priceOld && <div style={{ fontSize: '11px', color: 'var(--muted)', textDecoration: 'line-through', marginBottom: '2px' }}>{product.priceOld}</div>}
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 600, color: 'var(--terra)', lineHeight: 1 }}>
                        {product.priceNew}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}