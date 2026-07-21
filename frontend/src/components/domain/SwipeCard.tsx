import { useState } from 'react';
import {
    animate,
    motion,
    useAnimation,
    useMotionValue,
    useTransform,
    type PanInfo,
} from 'framer-motion';
import { Heart, Menu, Send, Undo2, X } from 'lucide-react';
import { type ProdutoVitrine } from '../../store/useCartStore';
import { getImageUrl } from '../../utils/imageUtils';
import { appRoutes } from '../../utils/appRoutes';

interface SwipeCardProps {
    product: ProdutoVitrine;
    isTop: boolean;
    index: number;
    onSwipe: (direction: 'like' | 'dislike') => void;
    onUndo: () => void;
    reactionCounts?: {
        likes?: number;
        dislikes?: number;
    };
    onShare?: () => void | Promise<void>;
    onMenuNavigate?: (path: string) => void;
    missionOverlay?: React.ReactNode;
}

function getSocialProofBadges(product: ProdutoVitrine, likesCount: number) {
    const likedNames = (product.nomesCurtidas ?? [])
        .map((name) => name.trim())
        .filter(Boolean)
        .slice(0, 2);

    if (likedNames.length > 0) {
        return likedNames.map((name) => `${name} curtiu esse item.`);
    }

    if (likesCount > 0) {
        return [
            `${likesCount} pessoa${likesCount === 1 ? '' : 's'} curtiu esse item.`,
        ];
    }

    return [];
}

function formatProductSize(size: string) {
    const normalizedSize = size.trim();
    if (!normalizedSize) return 'Único';

    return `${normalizedSize.charAt(0).toUpperCase()}${normalizedSize.slice(1).toLowerCase()}`;
}

/**
 * O card mantém a foto como superfície principal e reposiciona os metadados.
 * Os botões de ação ficam sobre a imagem e o bloco de título/tamanho/curtidas
 * foi movido para uma faixa inferior, criando a ordem visual pedida: foto,
 * ações e, abaixo delas, detalhes do produto.
 */
export function SwipeCard({
    product,
    isTop,
    index,
    onSwipe,
    onUndo,
    reactionCounts,
    onShare,
    onMenuNavigate,
    missionOverlay,
}: SwipeCardProps) {
    const [currentPhoto, setCurrentPhoto] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const productImages = product.images?.length ? product.images : [getImageUrl(null)];
    const totalPhotos = productImages.length;
    const activeImageSrc = getImageUrl(productImages[currentPhoto]);

    const x = useMotionValue(0);
    const rotate = useTransform(x, [-220, 220], [-16, 16]);
    const overlayOpacityLike = useTransform(x, [20, 110], [0, 1]);
    const overlayOpacityNope = useTransform(x, [-20, -110], [0, 1]);
    const heartControls = useAnimation();

    const scale = isTop ? 1 : 1 - index * 0.025;
    const yOffset = isTop ? 0 : index * 7;
    const visibleLikesCount = Math.max(reactionCounts?.likes ?? product.curtidasCount, 0);
    const visiblePassosCount = Math.max(reactionCounts?.dislikes ?? product.passosCount, 0);
    const socialProofBadges = getSocialProofBadges(product, visibleLikesCount);
    const productSize = formatProductSize(product.tamanho);

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

    const handleMenuNavigate = (path: string) => {
        setIsMenuOpen(false);
        onMenuNavigate?.(path);
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
                borderRadius: '9px',
                background: '#DDD8CF',
                boxShadow: '0 10px 26px rgba(35, 31, 24, 0.16)',
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

                <header style={productHeaderStyle}>
                    <div style={productTitleBlockStyle}>
                        <h2 style={productTitleStyle}>{product.name}</h2>
                        <span style={productSizeStyle}>Tam. {productSize}</span>
                    </div>

                    {isTop && (
                        <button
                            type="button"
                            aria-label="Abrir menu"
                            aria-expanded={isMenuOpen}
                            onClick={(event) => {
                                event.stopPropagation();
                                setIsMenuOpen((isOpen) => !isOpen);
                            }}
                            style={menuButtonStyle}
                        >
                            <Menu size={20} strokeWidth={2} />
                        </button>
                    )}
                </header>

                {isTop && isMenuOpen && (
                    <nav
                        aria-label="Menu principal"
                        onClick={(event) => event.stopPropagation()}
                        onPointerDown={(event) => event.stopPropagation()}
                        style={menuPanelStyle}
                    >
                        <button type="button" onClick={() => handleMenuNavigate(appRoutes.forYou)} style={menuItemStyle}>
                            FOR YOU
                        </button>
                        <button type="button" onClick={() => handleMenuNavigate(appRoutes.explorar)} style={menuItemStyle}>
                            EXPLORAR
                        </button>
                        <button type="button" onClick={() => handleMenuNavigate(appRoutes.curtidas)} style={menuItemStyle}>
                            CURTIDAS
                        </button>
                        <button type="button" onClick={() => handleMenuNavigate(appRoutes.resgate)} style={menuItemStyle}>
                            RESGATE
                        </button>
                        <button type="button" onClick={() => handleMenuNavigate(appRoutes.perfil)} style={menuItemStyle}>
                            PERFIL
                        </button>
                        <button type="button" onClick={() => handleMenuNavigate(appRoutes.indique)} style={menuItemStyle}>
                            INDIQUE
                        </button>
                    </nav>
                )}

                {socialProofBadges.length > 0 && (
                    <div style={socialBadgesStyle}>
                        {socialProofBadges.map((badge) => (
                            <span key={badge} style={socialBadgeStyle}>
                                <Heart size={8} fill="currentColor" strokeWidth={0} />
                                {badge}
                            </span>
                        ))}
                    </div>
                )}

                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        inset: 'auto 0 0',
                        height: '250px',
                        zIndex: 20,
                        pointerEvents: 'none',
                        background:
                            'linear-gradient(0deg, rgba(13, 14, 12, 0.64) 0%, rgba(13, 14, 12, 0.22) 58%, transparent 100%)',
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
                            bottom: missionOverlay ? '62px' : '20px',
                            left: '50%',
                            zIndex: 70,
                            width: 'min(86%, 340px)',
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
                                count={visiblePassosCount}
                                tone="dislike"
                                onClick={() => void triggerSwipe('nope')}
                                icon={<X size={29} strokeWidth={1.35} />}
                            />
                            <ActionButton
                                label="Curtir peça"
                                count={visibleLikesCount}
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
                                onClick={() => {
                                    void Promise.resolve(onShare?.()).catch(() => undefined);
                                }}
                                icon={<Send size={18} />}
                            />
                        </div>
                    </div>
                )}

                {isTop && missionOverlay && (
                    <div
                        onClick={(event) => event.stopPropagation()}
                        onPointerDown={(event) => event.stopPropagation()}
                        style={missionOverlaySlotStyle}
                    >
                        {missionOverlay}
                    </div>
                )}
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

const productHeaderStyle: React.CSSProperties = {
    position: 'absolute',
    top: '30px',
    right: '13px',
    left: '13px',
    zIndex: 55,
    display: 'grid',
    gridTemplateColumns: '32px minmax(0, 1fr) 32px',
    alignItems: 'start',
    color: '#ffffff',
    pointerEvents: 'none',
};

const productTitleBlockStyle: React.CSSProperties = {
    gridColumn: 2,
    minWidth: 0,
    textAlign: 'center',
};

const productTitleStyle: React.CSSProperties = {
    overflow: 'hidden',
    margin: 0,
    color: '#ffffff',
    fontSize: 'clamp(14px, 4.2vw, 17px)',
    fontWeight: 900,
    lineHeight: 1.08,
    textOverflow: 'ellipsis',
    textShadow: '0 2px 10px rgba(0, 0, 0, 0.42)',
    whiteSpace: 'nowrap',
};

const productSizeStyle: React.CSSProperties = {
    display: 'block',
    marginTop: '6px',
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: '8px',
    fontWeight: 800,
    lineHeight: 1,
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.42)',
    whiteSpace: 'nowrap',
};

const menuButtonStyle: React.CSSProperties = {
    position: 'relative',
    zIndex: 2,
    display: 'grid',
    gridColumn: 3,
    width: '30px',
    height: '30px',
    justifySelf: 'end',
    placeItems: 'center',
    border: 0,
    borderRadius: '999px',
    color: '#ffffff',
    background: 'transparent',
    boxShadow: 'none',
    cursor: 'pointer',
    pointerEvents: 'auto',
};

const menuPanelStyle: React.CSSProperties = {
    position: 'absolute',
    top: '62px',
    right: '12px',
    zIndex: 90,
    display: 'flex',
    width: '142px',
    flexDirection: 'column',
    gap: '2px',
    borderRadius: '14px',
    background: 'rgba(18, 18, 18, 0.78)',
    padding: '7px',
    backdropFilter: 'blur(10px)',
};

const menuItemStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '30px',
    border: 0,
    borderRadius: '10px',
    background: 'transparent',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: 900,
    letterSpacing: '0.06em',
    textAlign: 'left',
    cursor: 'pointer',
    padding: '0 9px',
};

const socialBadgesStyle: React.CSSProperties = {
    position: 'absolute',
    top: '74px',
    left: '15px',
    right: '15px',
    zIndex: 55,
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    overflow: 'hidden',
    pointerEvents: 'none',
};

const socialBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    minWidth: 0,
    maxWidth: 'calc(50% - 4px)',
    height: '17px',
    alignItems: 'center',
    gap: '4px',
    overflow: 'hidden',
    borderRadius: '999px',
    color: 'rgba(66, 70, 61, 0.84)',
    background: 'rgba(255, 255, 255, 0.88)',
    padding: '0 8px',
    fontSize: '6.8px',
    fontWeight: 800,
    lineHeight: 1,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
};

const missionOverlaySlotStyle: React.CSSProperties = {
    position: 'absolute',
    right: 0,
    bottom: '7px',
    left: 0,
    zIndex: 80,
    pointerEvents: 'auto',
};
