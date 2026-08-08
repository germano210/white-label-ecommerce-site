import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { type ProdutoVitrine } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useConfiguracoesStore } from '../store/useConfiguracoesStore';
import { type CurtidasMode, useDiscoveryStore } from '../store/useDiscoveryStore';
import { AppHamburgerMenu } from '../components/layout/AppHamburgerMenu';
import { api, isCookieAuthMode } from '../utils/api';
import { getImageUrl } from '../utils/imageUtils';
import { formatCondicao } from '../utils/condicao';
import { apiRoutes } from '../utils/apiRoutes';
import { appRoutes } from '../utils/appRoutes';

interface CurtidasScreenProps {
    onBack?: () => void;
}

interface CreateCheckoutResponse {
    checkoutUrl?: string;
    gatewayUrl?: string;
    url?: string;
    pedidoId?: string | number;
}

function getProductImages(item: ProdutoVitrine) {
    const images = item.images?.length ? item.images : [null];
    return images.map((image) => getImageUrl(image));
}

function getProductSecondaryImages(item: ProdutoVitrine) {
    const secondaryImages = item.secondaryImages?.length
        ? item.secondaryImages
        : item.images?.slice(1) ?? [];

    return secondaryImages.map((image) => getImageUrl(image));
}

function getProductSize(item: ProdutoVitrine) {
    const size = item.tamanho?.trim();
    if (!size) return 'Tam. Único';

    return `Tam. ${size.charAt(0).toUpperCase()}${size.slice(1).toLowerCase()}`;
}

function getCheckoutErrorMessage(error: unknown) {
    if (!axios.isAxiosError(error)) {
        return 'Não foi possível iniciar o resgate agora. Tente novamente.';
    }

    const responseData = error.response?.data as { message?: string; error?: string } | undefined;
    return responseData?.message
        ?? responseData?.error
        ?? 'Não foi possível iniciar o resgate agora. Tente novamente.';
}

function isPurchasedLikedItem(item: ProdutoVitrine) {
    if (item.comprado || item.resgatado) return true;

    const normalizedStatus = item.statusCompra
        ?.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toUpperCase();

    return Boolean(normalizedStatus && [
        'PAGO',
        'PAGA',
        'APROVADO',
        'APROVADA',
        'CONFIRMADO',
        'CONFIRMADA',
        'CONCLUIDO',
        'CONCLUIDA',
        'COMPRADO',
        'COMPRADA',
        'RESGATADO',
        'RESGATADA',
        'PAGAMENTO_APROVADO',
        'PAGAMENTO_CONFIRMADO',
        'FINALIZADO',
        'FINALIZADA',
        'ENTREGUE',
        'ENVIADO',
        'PAID',
        'APPROVED',
        'CONFIRMED',
        'COMPLETED',
        'REDEEMED',
    ].includes(normalizedStatus));
}

export function CurtidasScreen({ onBack }: CurtidasScreenProps) {
    const navigate = useNavigate();
    const authUser = useAuthStore((state) => state.user);
    const authToken = useAuthStore((state) => state.token);
    const logout = useAuthStore((state) => state.logout);
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
    const [checkoutItemId, setCheckoutItemId] = useState<string | null>(null);
    const [checkoutErrorByItemId, setCheckoutErrorByItemId] = useState<Record<string, string>>({});
    const checkoutInFlightRef = useRef(false);
    const {
        products,
        likedItems,
        curtidasMode,
        isCurtidasLoading,
        curtidasError,
        fetchProdutos,
        fetchCurtidas,
        setCurtidasMode,
    } = useDiscoveryStore();
    const isAuthenticated = isCookieAuthMode ? Boolean(authUser) : Boolean(authToken && authUser);

    useEffect(() => {
        void fetchCurtidas();
    }, [fetchCurtidas]);

    useEffect(() => {
        if (products.length > 0) return;
        void fetchProdutos();
    }, [fetchProdutos, products.length]);

    useEffect(() => {
        const previousBodyBackground = document.body.style.backgroundColor;
        const previousHtmlBackground = document.documentElement.style.backgroundColor;

        document.body.style.backgroundColor = '#e6e6e6';
        document.documentElement.style.backgroundColor = '#e6e6e6';

        return () => {
            document.body.style.backgroundColor = previousBodyBackground;
            document.documentElement.style.backgroundColor = previousHtmlBackground;
        };
    }, []);

    const isResgateMode = curtidasMode === 'resgate';
    const likedItemsWithGallery = useMemo(() => {
        return likedItems.map((item) => {
            const productWithGallery = products.find((product) => product.id === item.id);
            const hasRicherGallery = (
                (productWithGallery?.secondaryImages?.length ?? 0) > (item.secondaryImages?.length ?? 0)
                || (productWithGallery?.images?.length ?? 0) > (item.images?.length ?? 0)
            );

            if (!productWithGallery || !hasRicherGallery) return item;

            return {
                ...item,
                images: productWithGallery.images ?? item.images,
                secondaryImages: productWithGallery.secondaryImages ?? item.secondaryImages,
            };
        });
    }, [likedItems, products]);
    const visibleItems = useMemo(() => {
        return isResgateMode
            ? likedItemsWithGallery.filter(isPurchasedLikedItem)
            : likedItemsWithGallery;
    }, [isResgateMode, likedItemsWithGallery]);

    const handleTabChange = (mode: CurtidasMode) => {
        setCurtidasMode(mode);
        navigate(mode === 'resgate' ? appRoutes.resgate : appRoutes.curtidas);
    };

    const handleGoToForYou = () => {
        if (onBack) {
            onBack();
            return;
        }

        navigate(appRoutes.forYou);
    };

    const handleCreateCheckout = async (item: ProdutoVitrine) => {
        if (!isAuthenticated) {
            setCheckoutErrorByItemId((currentErrors) => ({
                ...currentErrors,
                [item.id]: 'Entre para continuar o resgate.',
            }));
            return;
        }

        if (checkoutInFlightRef.current) return;

        checkoutInFlightRef.current = true;
        setCheckoutItemId(item.id);
        setCheckoutErrorByItemId((currentErrors) => {
            const { [item.id]: _removedError, ...nextErrors } = currentErrors;
            return nextErrors;
        });

        try {
            const { data } = await api.post<CreateCheckoutResponse>(apiRoutes.checkout.produto(item.id));
            const checkoutUrl = data.checkoutUrl ?? data.gatewayUrl ?? data.url;

            if (!checkoutUrl) {
                throw new Error('Checkout sem URL de redirecionamento.');
            }

            window.location.assign(checkoutUrl);
        } catch (error) {
            if (axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) {
                logout();
            }

            setCheckoutErrorByItemId((currentErrors) => ({
                ...currentErrors,
                [item.id]: getCheckoutErrorMessage(error),
            }));
        } finally {
            checkoutInFlightRef.current = false;
            setCheckoutItemId(null);
        }
    };

    return (
        <main style={screenStyle}>
            <div style={windowStyle}>
                <AppHamburgerMenu contained />
                <header style={headerStyle}>
                <nav style={tabsStyle} aria-label="Curtidas">
                    <button
                        type="button"
                        onClick={() => handleTabChange('lista')}
                        style={{
                            ...tabButtonStyle,
                            ...(isResgateMode ? inactiveTabStyle : activeTabStyle),
                        }}
                    >
                        Suas curtidas
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabChange('resgate')}
                        style={{
                            ...tabButtonStyle,
                            ...(isResgateMode ? activeTabStyle : inactiveTabStyle),
                        }}
                    >
                        Resgates
                    </button>
                </nav>
            </header>

            <section style={contentStyle} aria-label="Produtos curtidos">
                {isCurtidasLoading && (
                    <StateMessage
                        title="Carregando curtidas"
                        description="Estamos buscando suas peças salvas."
                    />
                )}

                {!isCurtidasLoading && curtidasError && (
                    <StateMessage
                        title="Não conseguimos carregar"
                        description={curtidasError}
                        actionLabel="Tentar novamente"
                        onAction={() => void fetchCurtidas()}
                    />
                )}

                {!isCurtidasLoading && !curtidasError && visibleItems.length === 0 && (
                    <StateMessage
                        title={isResgateMode ? 'X' : 'Nenhuma curtida ainda'}
                        description={isResgateMode
                            ? 'Você ainda não resgatou nenhum item.'
                            : 'Volte para o For You e curta as peças que combinam com você.'}
                        actionLabel={isResgateMode ? undefined : 'Ver peças'}
                        onAction={isResgateMode ? undefined : handleGoToForYou}
                    />
                )}

                {!isCurtidasLoading && !curtidasError && visibleItems.length > 0 && (
                    <div style={gridStyle}>
                        {visibleItems.map((item) => (
                            <LikedProductCard
                                key={item.id}
                                item={item}
                                isResgateMode={isResgateMode}
                                isExpanded={expandedItemId === item.id}
                                isCreatingCheckout={checkoutItemId === item.id}
                                checkoutError={checkoutErrorByItemId[item.id]}
                                onExpand={() => setExpandedItemId(item.id)}
                                onRedeem={() => void handleCreateCheckout(item)}
                            />
                        ))}
                    </div>
                )}
                </section>
            </div>
        </main>
    );
}

interface LikedProductCardProps {
    item: ProdutoVitrine;
    isResgateMode: boolean;
    isExpanded: boolean;
    isCreatingCheckout: boolean;
    checkoutError?: string;
    onExpand: () => void;
    onRedeem: () => void;
}

function LikedProductCard({
    item,
    isResgateMode,
    isExpanded,
    isCreatingCheckout,
    checkoutError,
    onExpand,
    onRedeem,
}: LikedProductCardProps) {
    const condicaoCasasDecimais = useConfiguracoesStore((state) => state.condicaoCasasDecimais);
    const images = getProductImages(item);
    const mainImage = images[0] ?? getImageUrl(null);
    const secondaryImages = getProductSecondaryImages(item);
    const productCondition = formatCondicao(item.condicao, condicaoCasasDecimais);

    return (
        <article
            style={{
                ...productCardStyle,
                ...(isExpanded ? expandedProductCardStyle : null),
                backgroundImage: `url("${mainImage}")`,
            }}
        >
            {isExpanded && <div aria-hidden="true" style={expandedBackgroundOverlayStyle} />}

            <div style={{
                ...productInfoStyle,
                ...(isExpanded ? expandedProductInfoStyle : overlayProductInfoStyle),
            }}>
                <h2 style={{
                    ...productNameStyle,
                    ...(isExpanded ? expandedProductNameStyle : overlayProductTextStyle),
                }}>
                    {item.name}
                </h2>
                <span style={{
                    ...productSizeStyle,
                    ...(isExpanded ? expandedProductSizeStyle : overlayProductTextStyle),
                }}>
                    {getProductSize(item)}
                </span>
                {productCondition && (
                    <span style={{
                        ...productConditionStyle,
                        ...(isExpanded ? expandedProductSizeStyle : overlayProductTextStyle),
                    }}>
                        Cond. {productCondition}
                    </span>
                )}
            </div>

            <div style={{
                ...imageWrapStyle,
                ...(isExpanded ? expandedImageWrapStyle : fullCardImageWrapStyle),
            }}>
                {isExpanded ? (
                    secondaryImages.length > 0 ? (
                        <div style={marketplaceGalleryStyle} aria-label="Fotos adicionais do produto">
                            {secondaryImages.map((image, imageIndex) => (
                                <img
                                    key={`${image}-${imageIndex}`}
                                    src={image}
                                    alt={`${item.name} - foto ${imageIndex + 2}`}
                                    loading="lazy"
                                    style={marketplaceGalleryImageStyle}
                                />
                            ))}
                        </div>
                    ) : (
                        <div style={emptyGalleryStyle}>
                            Sem fotos adicionais.
                        </div>
                    )
                ) : (
                    <img
                        src={mainImage}
                        alt={item.name}
                        loading="lazy"
                        style={productImageStyle}
                    />
                )}
            </div>

            <button
                type="button"
                onClick={() => {
                    if (!isExpanded) {
                        onExpand();
                        return;
                    }

                    if (!isResgateMode) onRedeem();
                }}
                disabled={isCreatingCheckout || (isResgateMode && isExpanded)}
                style={{
                    ...cardButtonStyle,
                    ...(isExpanded ? null : overlayCardButtonStyle),
                    ...(isExpanded ? cardButtonExpandedStyle : cardButtonDefaultStyle),
                    opacity: isCreatingCheckout ? 0.72 : 1,
                    cursor: isCreatingCheckout
                        ? 'wait'
                        : isResgateMode && isExpanded
                            ? 'default'
                            : 'pointer',
                }}
            >
                {isCreatingCheckout
                    ? 'Criando...'
                    : isExpanded
                        ? isResgateMode
                            ? 'Item resgatado'
                            : 'Resgatar item'
                        : 'Ver item'}
            </button>

            {isExpanded && checkoutError && (
                <p role="alert" style={cardErrorStyle}>{checkoutError}</p>
            )}
        </article>
    );
}

interface StateMessageProps {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

function StateMessage({
    title,
    description,
    actionLabel,
    onAction,
}: StateMessageProps) {
    return (
        <div style={stateStyle}>
            <h1 style={stateTitleStyle}>{title}</h1>
            <p style={stateDescriptionStyle}>{description}</p>
            {actionLabel && onAction && (
                <button type="button" onClick={onAction} style={stateButtonStyle}>
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

const screenStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    boxSizing: 'border-box',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '430px',
    height: '100dvh',
    margin: '0 auto',
    overflow: 'hidden',
    background: '#e6e6e6',
    color: '#000000',
    fontFamily: "'DM Sans', sans-serif",
    padding: '7px 4px 7px',
};

const windowStyle: CSSProperties = {
    position: 'relative',
    display: 'flex',
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    overflow: 'hidden',
    borderRadius: '9px 9px 0 0',
    background: '#ffffff',
};

const headerStyle: CSSProperties = {
    position: 'relative',
    flex: '0 0 auto',
    minHeight: '64px',
    padding: '30px 58px 11px',
    background: '#ffffff',
};

const tabsStyle: CSSProperties = {
    position: 'static',
    display: 'flex',
    width: '100%',
    maxWidth: 'none',
    height: 'auto',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: '22px',
    margin: 0,
    padding: 0,
    background: 'transparent',
    backdropFilter: 'none',
    zIndex: 'auto',
};

const tabButtonStyle: CSSProperties = {
    position: 'relative',
    border: 0,
    background: 'transparent',
    cursor: 'pointer',
    padding: '0 0 5px',
    fontSize: '8.5px',
    fontWeight: 700,
    lineHeight: 1,
};

const activeTabStyle: CSSProperties = {
    color: '#000000',
    boxShadow: 'inset 0 -1px 0 #000000',
};

const inactiveTabStyle: CSSProperties = {
    color: '#b8b8b8',
    boxShadow: 'inset 0 -1px 0 transparent',
};

const contentStyle: CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflowX: 'hidden',
    overflowY: 'auto',
    padding: '8px 8px 96px',
    background: '#ffffff',
    scrollbarWidth: 'none',
};

const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '9px',
    alignItems: 'start',
};

const productCardStyle: CSSProperties = {
    position: 'relative',
    display: 'flex',
    minWidth: 0,
    minHeight: '260px',
    flexDirection: 'column',
    overflow: 'hidden',
    borderRadius: '7px',
    background: '#ffffff',
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    boxShadow: '0 8px 22px rgba(0, 0, 0, 0.07)',
};

const expandedProductCardStyle: CSSProperties = {
    backgroundColor: '#ffffff',
};

const expandedBackgroundOverlayStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    pointerEvents: 'none',
};

const productInfoStyle: CSSProperties = {
    position: 'relative',
    zIndex: 1,
    minHeight: '37px',
    padding: '12px 8px 6px',
    textAlign: 'center',
};

const overlayProductInfoStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    minHeight: '48px',
    padding: '13px 8px 18px',
    background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.36) 0%, rgba(0, 0, 0, 0.12) 62%, transparent 100%)',
};

const expandedProductInfoStyle: CSSProperties = {
    position: 'relative',
    top: 'auto',
    right: 'auto',
    left: 'auto',
    background: 'transparent',
    paddingTop: '11px',
};

const productNameStyle: CSSProperties = {
    margin: 0,
    overflow: 'hidden',
    color: '#000000',
    fontSize: '8.8px',
    fontWeight: 900,
    lineHeight: 1.08,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
};

const productSizeStyle: CSSProperties = {
    display: 'block',
    marginTop: '5px',
    overflow: 'hidden',
    color: '#6f6f6f',
    opacity: 0.7,
    fontSize: '7.2px',
    fontWeight: 600,
    lineHeight: 1,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
};

const productConditionStyle: CSSProperties = {
    display: 'block',
    marginTop: '4px',
    overflow: 'hidden',
    color: '#6f6f6f',
    opacity: 0.64,
    fontSize: '6.8px',
    fontWeight: 600,
    lineHeight: 1,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
};

const overlayProductTextStyle: CSSProperties = {
    color: '#ffffff',
    textShadow: '0 1px 5px rgba(0, 0, 0, 0.42)',
};

const expandedProductNameStyle: CSSProperties = {
    color: '#000000',
    textShadow: 'none',
};

const expandedProductSizeStyle: CSSProperties = {
    color: '#6f6f6f',
    textShadow: 'none',
};

const imageWrapStyle: CSSProperties = {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flex: 1,
    minHeight: '154px',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    background: '#f7f6f2',
};

const fullCardImageWrapStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    minHeight: '100%',
    background: 'transparent',
};

const expandedImageWrapStyle: CSSProperties = {
    position: 'relative',
    inset: 'auto',
    zIndex: 1,
    minHeight: '170px',
    background: 'transparent',
    padding: '8px 0 0',
};

const productImageStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
};

const marketplaceGalleryStyle: CSSProperties = {
    display: 'flex',
    width: '100%',
    height: '100%',
    gap: '8px',
    overflowX: 'auto',
    overflowY: 'hidden',
    scrollSnapType: 'x mandatory',
    padding: '0 10px 4px',
};

const marketplaceGalleryImageStyle: CSSProperties = {
    flex: '0 0 86%',
    width: '86%',
    height: '100%',
    minHeight: '162px',
    borderRadius: '10px',
    objectFit: 'cover',
    scrollSnapAlign: 'center',
    background: 'transparent',
    boxShadow: 'none',
};

const emptyGalleryStyle: CSSProperties = {
    display: 'grid',
    width: 'calc(100% - 20px)',
    minHeight: '150px',
    margin: '0 10px',
    placeItems: 'center',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.66)',
    color: '#777',
    fontSize: '9px',
    fontWeight: 800,
};

const cardButtonStyle: CSSProperties = {
    position: 'relative',
    zIndex: 1,
    minHeight: '42px',
    margin: '10px 13px 13px',
    border: 0,
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '7.5px',
    fontWeight: 900,
    lineHeight: 1,
};

const overlayCardButtonStyle: CSSProperties = {
    position: 'absolute',
    right: '13px',
    bottom: '13px',
    left: '13px',
    margin: 0,
};

const cardButtonDefaultStyle: CSSProperties = {
    background: '#ffffff',
    color: '#222222',
    boxShadow: '0 8px 22px rgba(0, 0, 0, 0.08)',
};

const cardButtonExpandedStyle: CSSProperties = {
    background: '#687152',
    color: '#ffffff',
    boxShadow: 'none',
};

const cardErrorStyle: CSSProperties = {
    position: 'relative',
    zIndex: 1,
    margin: '-3px 13px 11px',
    color: '#8a372f',
    fontSize: '7.2px',
    fontWeight: 800,
    lineHeight: 1.25,
    textAlign: 'center',
};

const stateStyle: CSSProperties = {
    display: 'flex',
    minHeight: 'calc(100dvh - 168px)',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    textAlign: 'center',
};

const stateTitleStyle: CSSProperties = {
    margin: 0,
    color: '#000000',
    fontSize: '20px',
    fontWeight: 900,
    lineHeight: 1.1,
};

const stateDescriptionStyle: CSSProperties = {
    maxWidth: '270px',
    margin: '10px 0 0',
    color: '#777777',
    fontSize: '12px',
    fontWeight: 600,
    lineHeight: 1.45,
};

const stateButtonStyle: CSSProperties = {
    minHeight: '40px',
    marginTop: '18px',
    border: 0,
    borderRadius: '10px',
    background: '#687152',
    color: '#ffffff',
    cursor: 'pointer',
    padding: '0 18px',
    fontSize: '11px',
    fontWeight: 900,
};
