import { motion, useMotionValue, useTransform, useAnimation, type PanInfo } from 'framer-motion';
import { type ProdutoVitrine } from '../../store/useCartStore';
import { useDiscoveryStore } from '../../store/useDiscoveryStore';

interface SwipeCardProps {
    product: ProdutoVitrine;
    isTop: boolean;
    index: number;
    onSwipeEnd: () => void;
}

export function SwipeCard({ product, isTop, index, onSwipeEnd }: SwipeCardProps) {
    const swipeRight = useDiscoveryStore((state) => state.swipeRight);
    const swipeLeft = useDiscoveryStore((state) => state.swipeLeft);

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-28, 28]);
    const opacityLike = useTransform(x, [50, 150], [0, 1]);
    const opacityNope = useTransform(x, [-50, -150], [0, 1]);

    const controls = useAnimation();

    const scale = isTop ? 1 : 1 - (index * 0.04);
    const yOffset = isTop ? 0 : index * 10;

    // CORREÇÃO: Usar _event para silenciar o aviso do TypeScript
    const handleDragEnd = async (_event: any, info: PanInfo) => {
        const offset = info.offset.x;
        const velocity = info.velocity.x;

        if (offset > 100 || velocity > 500) {
            await controls.start({ x: window.innerWidth, transition: { duration: 0.3 } });
            swipeRight(product);
            onSwipeEnd();
        } else if (offset < -100 || velocity < -500) {
            await controls.start({ x: -window.innerWidth, transition: { duration: 0.3 } });
            swipeLeft(product);
            onSwipeEnd();
        } else {
            controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
        }
    };

    return (
        <motion.div
            className={`swipe-card ${isTop ? 'on-top' : ''}`}
            style={{ x, rotate, scale, y: yOffset, zIndex: isTop ? 10 : 10 - index }}
            animate={controls}
            drag={isTop ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            whileTap={{ cursor: 'grabbing' }}
        >
            <motion.div style={{ opacity: opacityLike }} className="card-overlay-like">AMEI ✓</motion.div>
            <motion.div style={{ opacity: opacityNope }} className="card-overlay-nope">NÃO ✗</motion.div>

            {/* Usando exatamente a estrutura do seu HTML */}
            <div className="card-img">
                <span style={{ fontSize: '80px' }}>{product.emoji}</span>
                {product.badge && <span className={`card-badge ${product.badge}`}>{product.badgeText}</span>}
            </div>

            <div className="card-info">
                <div className="card-name">{product.name}</div>
                <div className="card-sub">{product.sub}</div>
                <div className="card-social"><b>{product.social}</b></div>
            </div>
        </motion.div>
    );
}