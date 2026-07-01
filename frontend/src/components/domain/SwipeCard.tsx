import { useState } from 'react';
import {
    animate,
    motion,
    useAnimation,
    useMotionValue,
    useTransform,
    type PanInfo,
} from 'framer-motion';
import { Heart, Send, Undo2, X } from 'lucide-react';
import { type ProdutoVitrine } from '../../store/useCartStore';

interface SwipeCardProps {
    product: ProdutoVitrine;
    isTop: boolean;
    index: number;
    onSwipe: (direction: 'like' | 'dislike') => void;
    onUndo: () => void;
}

const fallbackImage =
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80';

function getSocialProofText(product: ProdutoVitrine) {
    const likedNames = (product.nomesCurtidas ?? [])
        .map((name) => name.trim())
        .filter(Boolean)
        .slice(0, 4);

    if (product.curtidasCount === 0) {
        return 'Peça adicionada agora!';
    }

    if (likedNames.length === 0) {
        return `Curtido por ${product.curtidasCount} pessoa${product.curtidasCount === 1 ? '' : 's'}.`;
    }

    const remainingLikes = Math.max(product.curtidasCount - likedNames.length, 0);

    if (remainingLikes > 0) {
        return `Curtido por ${likedNames.join(', ')} e mais ${remainingLikes} pessoa${remainingLikes === 1 ? '' : 's'}.`;
    }

    if (likedNames.length === 1) {
        return `Curtido por ${likedNames[0]}.`;
    }

    const lastName = likedNames.at(-1);
    const previousNames = likedNames.slice(0, -1).join(', ');

    return `Curtido por ${previousNames} e ${lastName}.`;
}

/**
 * O card mantém a foto como superfície principal e reposiciona os metadados.
 * Os botões de ação ficam sobre a imagem e o bloco de título/tamanho/curtidas
 * foi movido para uma faixa inferior, criando a ordem visual pedida: foto,
 * ações e, abaixo delas, detalhes do produto.
 */
export function SwipeCard({ product, isTop, index, onSwipe, onUndo }: SwipeCardProps) {
    const [currentPhoto, setCurrentPhoto] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);

    const productImages = product.images?.length ? product.images : [fallbackImage];
    const totalPhotos = productImages.length;
    const activeImageSrc = productImages[currentPhoto];

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-220, 220], [-16, 16]);
    const overlayOpacityLike = useTransform(x, [20, 110], [0, 1]);
    const overlayOpacityNope = useTransform(x, [-20, -110], [0, 1]);
    const heartControls = useAnimation();

    const scale = isTop ? 1 : 1 - index * 0.025;
    const yOffset = isTop ? 0 : index * 7;
    const socialProofText = getSocialProofText(product);

    const handlePhotoTap = (event: React.MouseEvent | React.TouchEvent) => {
        if (!isTop || isSwiping) return;

        const rect = event.currentTarget.getBoundingClientRect();
        const clientX = 'touches' in event
            ? event.touches[0].clientX
            : event.clientX;
        const clickedRightSide = clientX - rect.left > rect.width / 2;

        if (clickedRightSide && currentPhoto < totalPhotos - 1) {
            setCurrentPhoto((photo) => photo + 1);
        } else if (!clickedRightSide && currentPhoto > 0) {
            setCurrentPhoto((photo) => photo - 1);
        }
    };

    const triggerSwipe = async (type: 'like' | 'nope', hasInteractionLock = false) => {
        if (!hasInteractionLock && (!isTop || isSwiping)) return;

        if (!hasInteractionLock) setIsSwiping(true);
        const direction = type === 'like' ? 1 : -1;
        const xOut = direction * Math.max(window.innerWidth * 1.35, 560);

        await animate(x, xOut, {
            duration: 0.34,
            ease: [0.22, 1, 0.36, 1],
        });

        onSwipe(type === 'like' ? 'like' : 'dislike');
    };

    const handleDragEnd = async (
        _event: MouseEvent | TouchEvent | PointerEvent,
        info: PanInfo,
    ) => {
        if (isSwiping) return;

        if (info.offset.x > 100 || info.velocity.x > 500) {
            await triggerSwipe('like');
        } else if (info.offset.x < -100 || info.velocity.x < -500) {
            await triggerSwipe('nope');
        } else {
            await animate(x, 0, {
                type: 'spring',
                stiffness: 320,
                damping: 22,
            });
        }
    };

    const handleHeartClick = async (event: React.MouseEvent) => {
        event.stopPropagation();
        if (!isTop || isSwiping) return;

        setIsSwiping(true);
        await heartControls.start({
            scale: [1, 1.18, 0.92],
            transition: { duration: 0.32, ease: 'easeOut' },
        });

        await triggerSwipe('like', true);
    };

    return (
        <motion.article
            className={`swipe-card ${isTop ? 'on-top' : ''}`}
            style={{
                x,
                rotate,
                scale,
                y: yOffset,
                zIndex: isTop ? 10 : 10 - index,
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                borderRadius: 'var(--radius-card)',
                background: '#DDD8CF',
                boxShadow: '0 8px 24px rgba(35, 31, 24, 0.14)',
                fontFamily: "'DM Sans', sans-serif",
                touchAction: 'none',
            }}
            drag={isTop && !isSwiping ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
        >
            <div
                onClick={handlePhotoTap}
                style={{
                    position: 'absolute',
                    inset: 0,
                    overflow: 'hidden',
                    cursor: isTop ? 'pointer' : 'default',
                }}
            >
                <img
                    src={activeImageSrc}
                    alt={product.name}
                    draggable={false}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        userSelect: 'none',
                    }}
                />

                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        inset: '0 0 auto',
                        height: '185px',
                        zIndex: 20,
                        pointerEvents: 'none',
                        background:
                            'linear-gradient(180deg, rgba(16, 18, 15, 0.58) 0%, rgba(16, 18, 15, 0.12) 72%, transparent 100%)',
                    }}
                />

                <div
                    aria-label={`Foto ${currentPhoto + 1} de ${totalPhotos}`}
                    style={{
                        position: 'absolute',
                        top: '13px',
                        left: '10px',
                        right: '10px',
                        zIndex: 45,
                        display: 'flex',
                        gap: '4px',
                    }}
                >
                    {Array.from({ length: totalPhotos }).map((_, photoIndex) => (
                        <span
                            key={photoIndex}
                            style={{
                                flex: 1,
                                height: '3px',
                                borderRadius: 'var(--radius-button)',
                                background: photoIndex === currentPhoto
                                    ? 'var(--color-action-button)'
                                    : 'rgba(255, 255, 255, 0.45)',
                            }}
                        />
                    ))}
                </div>

                <header
                    style={{
                        position: 'absolute',
                        top: '31px',
                        left: '0',
                        right: 'auto',
                        zIndex: 30,
                        width: 'fit-content',
                        maxWidth: 'calc(100% - 10px)',
                        padding: '8px 11px',
                        borderRadius: '0 999px 999px 0',
                        color: 'var(--color-action-button)',
                        background: 'rgba(8, 9, 8, 0.72)',
                        backdropFilter: 'blur(6px)',
                        pointerEvents: 'none',
                    }}
                >
                    {socialProofText && (
                        <p
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                margin: 0,
                                overflow: 'hidden',
                                fontSize: '9px',
                                fontWeight: 700,
                                lineHeight: 1.25,
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <Heart size={12} fill="currentColor" strokeWidth={0} />
                            {socialProofText}
                        </p>
                    )}
                </header>

                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        inset: 'auto 0 0',
                        height: '178px',
                        zIndex: 20,
                        pointerEvents: 'none',
                        background:
                            'linear-gradient(0deg, rgba(13, 14, 12, 0.48) 0%, rgba(13, 14, 12, 0.05) 76%, transparent 100%)',
                    }}
                />

                <motion.div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 40,
                        display: 'grid',
                        placeItems: 'center',
                        color: 'var(--color-action-button)',
                        background: 'rgba(104, 113, 82, 0.68)',
                        opacity: overlayOpacityLike,
                        pointerEvents: 'none',
                    }}
                >
                    <strong style={swipeStampStyle}>CURTI</strong>
                </motion.div>

                <motion.div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 40,
                        display: 'grid',
                        placeItems: 'center',
                        color: 'var(--color-action-button)',
                        background: 'rgba(142, 59, 59, 0.64)',
                        opacity: overlayOpacityNope,
                        pointerEvents: 'none',
                    }}
                >
                    <strong style={{ ...swipeStampStyle, transform: 'rotate(11deg)' }}>
                        PASSO
                    </strong>
                </motion.div>

                {isTop && (
                    <div
                        className="flex w-full items-center justify-between"
                        style={{
                            position: 'absolute',
                            bottom: '72px',
                            left: '50%',
                            zIndex: 50,
                            width: 'min(84%, 340px)',
                            transform: 'translateX(-50%)',
                        }}
                    >
                        <div
                            className="flex items-center justify-center"
                            style={{ width: '25%' }}
                        >
                            <ActionButton
                                label="Desfazer último swipe"
                                size="small"
                                tone="neutral"
                                onClick={onUndo}
                                icon={<Undo2 size={18} />}
                            />
                        </div>

                        <div
                            className="flex items-center justify-around"
                            style={{ width: '50%' }}
                        >
                            <ActionButton
                                label="Passar peça"
                                count={product.passosCount}
                                tone="dislike"
                                onClick={() => void triggerSwipe('nope')}
                                icon={<X size={29} strokeWidth={1.35} />}
                            />
                            <ActionButton
                                label="Curtir peça"
                                count={product.curtidasCount}
                                tone="like"
                                motionControls={heartControls}
                                onClick={(event) => void handleHeartClick(event)}
                                icon={
                                    <Heart
                                        size={28}
                                        strokeWidth={1.45}
                                        fill={isSwiping ? 'currentColor' : 'none'}
                                    />
                                }
                            />
                        </div>

                        <div
                            className="flex items-center justify-center"
                            style={{ width: '25%' }}
                        >
                            <ActionButton
                                label="Compartilhar peça"
                                size="small"
                                onClick={() => undefined}
                                icon={<Send size={18} />}
                            />
                        </div>
                    </div>
                )}

                <footer
                    style={{
                        position: 'absolute',
                        right: 0,
                        bottom: 0,
                        left: 0,
                        zIndex: 48,
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        alignItems: 'end',
                        gap: '10px',
                        minHeight: '45px',
                        padding: '12px 12px 10px',
                        color: 'var(--color-action-button)',
                        background: 'rgba(13, 14, 12, 0.66)',
                        pointerEvents: 'none',
                    }}
                >
                    <div style={{ minWidth: 0 }}>
                        <h2
                            style={{
                                overflow: 'hidden',
                                margin: 0,
                                fontSize: 'clamp(16px, 4.8vw, 19px)',
                                fontWeight: 800,
                                lineHeight: 1.08,
                                letterSpacing: '-0.03em',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {product.name}
                        </h2>
                    </div>

                    <span
                        style={{
                            color: 'rgba(255, 255, 255, 0.72)',
                            flexShrink: 0,
                            fontSize: '9px',
                            fontWeight: 700,
                            lineHeight: 1,
                            textAlign: 'right',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        Tam. {product.tamanho.toLowerCase()}
                    </span>
                </footer>
            </div>
        </motion.article>
    );
}

interface ActionButtonProps {
    label: string;
    icon: React.ReactNode;
    count?: number;
    tone?: 'neutral' | 'like' | 'dislike';
    size?: 'small' | 'large';
    motionControls?: ReturnType<typeof useAnimation>;
    onClick: (event: React.MouseEvent) => void;
}

function ActionButton({
    label,
    icon,
    count,
    tone = 'neutral',
    size = 'large',
    motionControls,
    onClick,
}: ActionButtonProps) {
    const dimension = size === 'small' ? 38 : 54;
    const isLike = tone === 'like';
    const buttonClassName = isLike
        ? 'bg-[var(--color-primary-like)] text-white'
        : 'bg-[var(--color-action-button)] text-[var(--text-dark)]';

    return (
        <div
            style={{
                display: 'flex',
                minWidth: `${dimension}px`,
                flexDirection: 'column',
                alignItems: 'center',
                gap: '5px',
                marginTop: size === 'small' ? '17px' : 0,
            }}
        >
            <motion.button
                className={buttonClassName}
                type="button"
                aria-label={label}
                animate={motionControls}
                onClick={(event) => {
                    event.stopPropagation();
                    onClick(event);
                }}
                whileTap={{ scale: 0.92 }}
                style={{
                    display: 'grid',
                    width: `${dimension}px`,
                    height: `${dimension}px`,
                    placeItems: 'center',
                    border: 0,
                    borderRadius: 'var(--radius-button)',
                    boxShadow: isLike
                        ? '0 8px 20px color-mix(in srgb, var(--color-primary-like) 30%, transparent)'
                        : '0 7px 18px rgba(0, 0, 0, 0.16)',
                    cursor: 'pointer',
                }}
            >
                {icon}
            </motion.button>

            {count !== undefined && size === 'large' && (
                <span
                    style={{
                        color: 'var(--color-action-button)',
                        fontSize: '11px',
                        fontWeight: 700,
                        lineHeight: 1,
                        textShadow: '0 1px 5px rgba(0, 0, 0, 0.45)',
                    }}
                >
                    {count}
                </span>
            )}
        </div>
    );
}

const swipeStampStyle: React.CSSProperties = {
    padding: '9px 25px',
    border: '3px solid currentColor',
    borderRadius: 'var(--radius-card)',
    fontSize: '31px',
    transform: 'rotate(-11deg)',
};
