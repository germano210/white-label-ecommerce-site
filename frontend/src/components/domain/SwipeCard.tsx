import { useState } from 'react';
import { motion, useMotionValue, useTransform, useAnimation, type PanInfo } from 'framer-motion';
import { useDiscoveryStore } from '../../store/useDiscoveryStore';
import { Undo2, X, Heart, Send } from 'lucide-react';

interface SwipeCardProps {
    product: any;
    isTop: boolean;
    index: number;
    onSwipeEnd: () => void;
}

export function SwipeCard({ product, isTop, index, onSwipeEnd }: SwipeCardProps) {
    const [currentPhoto, setCurrentPhoto] = useState(0);
    const [isHeartClicked, setIsHeartClicked] = useState(false);

    const productImages = product.images || ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80'];
    const totalPhotos = productImages.length;
    const activeImageSrc = productImages[currentPhoto];

    const swipeRight = useDiscoveryStore((state) => state.swipeRight);
    const swipeLeft = useDiscoveryStore((state) => state.swipeLeft);
    const undoLastSwipe = useDiscoveryStore((state) => state.undoLastSwipe);

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-25, 25]);
    const overlayOpacityLike = useTransform(x, [20, 100], [0, 1]);
    const overlayOpacityNope = useTransform(x, [-20, -100], [0, 1]);

    const controls = useAnimation();
    const heartControls = useAnimation(); // Controla o coração voando

    const scale = isTop ? 1 : 1 - (index * 0.04);
    const yOffset = isTop ? 0 : index * 10;

    const handlePhotoTap = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isTop || isHeartClicked) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clickX = clientX - rect.left;
        if (clickX > rect.width / 2) {
            if (currentPhoto < totalPhotos - 1) setCurrentPhoto(prev => prev + 1);
        } else {
            if (currentPhoto > 0) setCurrentPhoto(prev => prev - 1);
        }
    };

    const handleDragEnd = async (_event: any, info: PanInfo) => {
        if (isHeartClicked) return;
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

    const handleHeartClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isTop || isHeartClicked) return;
        setIsHeartClicked(true); // Preenche o coração de branco

        // A trajetória suave em arco para a aba "Curtidas" (Canto inferior direito)
        await heartControls.start({
            y: [0, 100, 350],
            x: [0, 50, 120],
            scale: [1, 1.3, 0.4],
            opacity: [1, 1, 0],
            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
        });

        swipeRight(product); // Isso vai disparar o pulso na BottomNav
        onSwipeEnd();
    };

    return (
        <motion.div
            className={`swipe-card ${isTop ? 'on-top' : ''}`}
            style={{
                x, rotate, scale, y: yOffset, zIndex: isTop ? 10 : 10 - index,
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                background: 'white', borderRadius: '24px', overflow: 'hidden',
                boxShadow: '0 8px 30px rgba(0,0,0,0.08)'
            }}
            animate={controls}
            drag={isTop && !isHeartClicked ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
        >
            <div
                className="card-img"
                onClick={handlePhotoTap}
                style={{
                    position: 'relative', flex: 1, minHeight: 0, background: '#F5F5F5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: isTop ? 'pointer' : 'default', overflow: 'hidden'
                }}
            >
                {/* Filtros de Drag (CURTI / PASSO) */}
                <motion.div style={{ position: 'absolute', inset: 0, background: 'rgba(45, 106, 79, 0.75)', opacity: overlayOpacityLike, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40, pointerEvents: 'none' }}>
                    <div style={{ color: 'white', fontSize: '36px', fontWeight: 800, fontFamily: 'var(--font-display)', border: '4px solid white', padding: '10px 30px', borderRadius: '16px', transform: 'rotate(-15deg)' }}>
                        CURTI
                    </div>
                </motion.div>
                <motion.div style={{ position: 'absolute', inset: 0, background: 'rgba(166, 61, 47, 0.75)', opacity: overlayOpacityNope, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40, pointerEvents: 'none' }}>
                    <div style={{ color: 'white', fontSize: '36px', fontWeight: 800, fontFamily: 'var(--font-display)', border: '4px solid white', padding: '10px 30px', borderRadius: '16px', transform: 'rotate(15deg)' }}>
                        PASSO
                    </div>
                </motion.div>

                {/* Barrinhas de Progresso */}
                <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', display: 'flex', gap: '4px', zIndex: 45 }}>
                    {Array.from({ length: totalPhotos }).map((_, i) => (
                        <div key={i} style={{
                            flex: 1, height: '3px', borderRadius: '2px',
                            background: i === currentPhoto ? 'var(--terra)' : 'rgba(255,255,255,0.5)',
                            transition: 'background 0.3s ease'
                        }} />
                    ))}
                </div>

                {/* Imagem Real */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
                    <img src={activeImageSrc} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                {/* Gradiente de fundo para botões */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '150px', background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', zIndex: 20, pointerEvents: 'none' }} />

                {isTop && (
                    <div style={{ position: 'absolute', bottom: '24px', left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: '20px', zIndex: 50 }}>
                        {/* Botão Voltar */}
                        <div style={{ marginTop: '18px' }}>
                            <button onClick={(e) => { e.stopPropagation(); undoLastSwipe(); }} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', color: 'var(--dark)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                <Undo2 size={20} />
                            </button>
                        </div>

                        {/* Botão X */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                            <button onClick={(e) => { e.stopPropagation(); triggerSwipe('nope'); }} style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', color: 'var(--dark)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                <X size={32} strokeWidth={1.5} />
                            </button>
                        </div>

                        {/* Botão Coração Simplificado */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                            <motion.button
                                animate={heartControls}
                                onClick={handleHeartClick}
                                style={{
                                    width: '56px', height: '56px', borderRadius: '50%',
                                    background: '#FF3B30',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: 'none', color: 'white', cursor: 'pointer',
                                    zIndex: 100
                                }}
                            >
                                <Heart size={32} strokeWidth={1.5} fill={isHeartClicked ? 'white' : 'none'} />
                            </motion.button>
                        </div>

                        {/* Botão Compartilhar */}
                        <div style={{ marginTop: '18px' }}>
                            <button onClick={(e) => e.stopPropagation()} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', color: 'var(--dark)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Info do Produto */}
            <div style={{ flexShrink: 0, padding: '28px 16px', textAlign: 'center', background: 'white' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 500, color: 'var(--dark)', marginBottom: '6px', letterSpacing: '0.02em' }}>
                    {product.name}
                </h3>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '13px', color: 'var(--muted)', textTransform: 'lowercase', letterSpacing: '0.1em' }}>
                    {product.sub.split('·').slice(0, 2).join('·')}
                </div>
            </div>
        </motion.div>
    );
}