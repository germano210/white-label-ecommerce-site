/**
 * DiscoveryScreen concentra a nova composição mobile-first da vitrine.
 * A imagem do produto é a superfície principal: ações, missões, menu e textos
 * são sobrepostos no próprio card, enquanto o progresso das missões continua
 * vindo exclusivamente de `/api/missoes`.
 */
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type FormEvent,
    type Ref,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    CheckCircle2,
    Heart,
    Share2,
    ShoppingBag,
    Sparkles,
    Star,
    X,
    type LucideIcon,
} from 'lucide-react';
import { SwipeCard } from '../components/domain/SwipeCard';
import { type ProdutoVitrine } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { type CurtidasMode, useDiscoveryStore } from '../store/useDiscoveryStore';
import { type Missao, type MissaoApiPayload, useMissaoStore } from '../store/useMissaoStore';
import { api } from '../utils/api';
import { apiRoutes } from '../utils/apiRoutes';

interface DiscoveryScreenProps {
    onNavigateToPath?: (path: string) => void;
    onNavigateToCurtidas?: (mode?: CurtidasMode) => void;
}

interface CurtidaResponse {
    missoes?: MissaoApiPayload;
    curtidasCount?: number | string | null;
    produto?: {
        curtidasCount?: number | string | null;
    } | null;
}

interface PassoResponse {
    passosCount?: number | string | null;
}

interface CompartilhamentoResponse {
    codigo?: string;
    code?: string;
    shareCode?: string;
}

function parseReactionCount(value: number | string | null | undefined) {
    const parsedValue = Math.floor(Number(value));
    return Number.isFinite(parsedValue) ? Math.max(parsedValue, 0) : null;
}

function isHttpStatus(error: unknown, status: number) {
    if (typeof error !== 'object' || error === null || !('response' in error)) {
        return false;
    }

    const response = (error as { response?: { status?: unknown } }).response;
    return response?.status === status;
}

export function DiscoveryScreen({
    onNavigateToPath,
    onNavigateToCurtidas,
}: DiscoveryScreenProps) {
    const products = useDiscoveryStore((state) => state.products);
    const isLoading = useDiscoveryStore((state) => state.isLoading);
    const error = useDiscoveryStore((state) => state.error);
    const fetchProdutos = useDiscoveryStore((state) => state.fetchProdutos);
    const removeProductFromStack = useDiscoveryStore((state) => state.removeProductFromStack);
    const restoreProductToStack = useDiscoveryStore((state) => state.restoreProductToStack);
    const syncProductReactionCount = useDiscoveryStore((state) => state.syncProductReactionCount);
    const productReactionCounts = useDiscoveryStore((state) => state.productReactionCounts);
    const activeCategory = useDiscoveryStore((state) => state.activeCategory);
    const swipeRight = useDiscoveryStore((state) => state.swipeRight);
    const swipeLeft = useDiscoveryStore((state) => state.swipeLeft);
    const undoLastSwipe = useDiscoveryStore((state) => state.undoLastSwipe);
    const matchAlertVisible = useDiscoveryStore((state) => state.matchAlertVisible);
    const dismissMatchAlert = useDiscoveryStore((state) => state.dismissMatchAlert);
    const namePromptVisible = useDiscoveryStore((state) => state.namePromptVisible);
    const dismissNamePrompt = useDiscoveryStore((state) => state.dismissNamePrompt);
    const fetchMissoes = useMissaoStore((state) => state.fetchMissoes);
    const setMissoesFromApi = useMissaoStore((state) => state.setMissoesFromApi);
    const updateUser = useAuthStore((state) => state.updateUser);
    const [profileName, setProfileName] = useState('');
    const [profileNameError, setProfileNameError] = useState('');
    const [isSavingProfileName, setIsSavingProfileName] = useState(false);

    useEffect(() => {
        void fetchProdutos();
    }, [fetchProdutos]);

    useEffect(() => {
        if (!matchAlertVisible) return;

        const timeoutId = window.setTimeout(dismissMatchAlert, 4500);
        return () => window.clearTimeout(timeoutId);
    }, [dismissMatchAlert, matchAlertVisible]);

    const displayProducts = useMemo(() => {
        const categoryProducts = activeCategory === 'TODAS AS PEÇAS'
            ? products
            : products.filter(
                (product) => product.category.toLowerCase() === activeCategory.toLowerCase(),
            );
        return categoryProducts.length > 0 ? categoryProducts : products;
    }, [activeCategory, products]);

    const currentStack = useMemo(() => {
        return displayProducts.slice(0, 2);
    }, [displayProducts]);
    const currentTopProduct = currentStack[0] ?? null;

    const handleSwipe = useCallback((
        product: ProdutoVitrine,
        direction: 'like' | 'dislike',
    ) => {
        removeProductFromStack(product.id);

        switch (direction) {
            case 'dislike':
                swipeLeft(product);
                void api.post<PassoResponse>(apiRoutes.passos.create(product.id))
                    .then(({ data }) => {
                        const passosCount = parseReactionCount(data.passosCount);
                        if (passosCount === null) return;

                        syncProductReactionCount(product.id, { dislikes: passosCount });
                    })
                    .catch((error: unknown) => {
                        if (isHttpStatus(error, 409)) {
                            void fetchProdutos();
                        }
                    });
                break;

            case 'like':
                swipeRight(product);
                void api.post<CurtidaResponse>(apiRoutes.curtidas.create(product.id))
                    .then(async ({ data }) => {
                        const curtidasCount = parseReactionCount(
                            data.curtidasCount ?? data.produto?.curtidasCount,
                        );

                        if (curtidasCount !== null) {
                            syncProductReactionCount(product.id, { likes: curtidasCount });
                        }

                        if (data.missoes) {
                            setMissoesFromApi(data.missoes);
                            return;
                        }

                        await fetchMissoes();
                    })
                    .catch(() => {
                        // A missão só muda com sucesso da API; falhas não geram progresso local definitivo.
                    });
                break;
        }
    }, [
        fetchMissoes,
        fetchProdutos,
        removeProductFromStack,
        setMissoesFromApi,
        swipeLeft,
        swipeRight,
        syncProductReactionCount,
    ]);

    const handleUndo = useCallback(() => {
        const restoredProduct = undoLastSwipe();
        if (!restoredProduct) return;

        restoreProductToStack(restoredProduct);
    }, [restoreProductToStack, undoLastSwipe]);

    const handleShareCurrentProduct = useCallback(async () => {
        if (!currentTopProduct) return;

        const { data } = await api.post<CompartilhamentoResponse>(
            apiRoutes.compartilhamentos.create(currentTopProduct.id),
        );
        const codigo = data.codigo ?? data.code ?? data.shareCode;

        if (!codigo) {
            throw new Error('Resposta de compartilhamento sem código.');
        }

        const shareUrl = new URL(window.location.href);
        shareUrl.searchParams.set('share', codigo);

        const shareData = {
            title: currentTopProduct.name,
            text: `${currentTopProduct.name} - ${currentTopProduct.priceNew}`,
            url: shareUrl.toString(),
        };

        if (navigator.share) {
            await navigator.share(shareData);
            return;
        }

        await copyShareTextToClipboard(`${shareData.text}\n${shareData.url}`);
    }, [currentTopProduct]);

    const handleSaveProfileName = useCallback(async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const nextProfileName = profileName.trim();
        if (nextProfileName.length < 2) {
            setProfileNameError('Digite seu nome para continuar.');
            return;
        }

        setProfileNameError('');
        setIsSavingProfileName(true);

        try {
            await api.put(apiRoutes.auth.updateName, { nome: nextProfileName });
            updateUser({ name: nextProfileName, nome: nextProfileName });
            dismissNamePrompt();
        } catch {
            setProfileNameError('Não conseguimos salvar seu nome agora. Tente novamente.');
        } finally {
            setIsSavingProfileName(false);
        }
    }, [dismissNamePrompt, profileName, updateUser]);

    return (
        <main style={screenStyle}>
            <AnimatePresence>
                {matchAlertVisible && (
                    <motion.div
                        role="status"
                        initial={{ opacity: 0, y: -18, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -12, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                        style={matchAlertStyle}
                    >
                        <CheckCircle2 size={22} aria-hidden="true" />
                        <strong style={{ flex: 1, fontSize: '14px' }}>
                            Conseguiste 3 Matchs! Vai à tua lista
                        </strong>
                        <button
                            type="button"
                            aria-label="Fechar aviso"
                            onClick={dismissMatchAlert}
                            style={matchCloseButtonStyle}
                        >
                            <X size={18} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {namePromptVisible && (
                    <NamePromptModal
                        profileName={profileName}
                        profileNameError={profileNameError}
                        isSavingProfileName={isSavingProfileName}
                        onProfileNameChange={(name) => {
                            setProfileName(name.slice(0, 50));
                            setProfileNameError('');
                        }}
                        onSubmit={handleSaveProfileName}
                    />
                )}
            </AnimatePresence>

            <section
                aria-label="Peças para descobrir"
                style={stackSectionStyle}
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
                        onAction={() => void fetchProdutos()}
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
                            onShare={handleShareCurrentProduct}
                            onMenuNavigate={onNavigateToPath}
                            reactionCounts={productReactionCounts[product.id]}
                            missionOverlay={stackIndex === 0 ? (
                                <MissionsRail
                                    currentProduct={product}
                                    onNavigateToCurtidas={onNavigateToCurtidas}
                                    onShareCurrentProduct={handleShareCurrentProduct}
                                />
                            ) : undefined}
                        />
                    );
                })}
            </section>
        </main>
    );
}

/**
 * O rail preserva a ordem oficial do backend e posiciona o scroll na primeira
 * missão ainda não concluída, deixando as anteriores acessíveis ao voltar.
 */
interface MissionsRailProps {
    currentProduct: ProdutoVitrine | null;
    onNavigateToCurtidas?: (mode?: CurtidasMode) => void;
    onShareCurrentProduct: () => Promise<void>;
}

function MissionsRail({
    currentProduct,
    onNavigateToCurtidas,
    onShareCurrentProduct,
}: MissionsRailProps) {
    const missoes = useMissaoStore((state) => state.missoes);
    const fetchMissoes = useMissaoStore((state) => state.fetchMissoes);
    const currentMissionCardRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        void fetchMissoes();
    }, [fetchMissoes]);

    const currentMissionId = useMemo(() => {
        return missoes.find((missao) => !missao.concluida)?.id ?? null;
    }, [missoes]);

    useEffect(() => {
        if (!currentMissionId) return;

        const animationFrame = window.requestAnimationFrame(() => {
            currentMissionCardRef.current?.scrollIntoView({
                block: 'nearest',
                inline: 'start',
            });
        });

        return () => window.cancelAnimationFrame(animationFrame);
    }, [currentMissionId]);

    return (
        <footer style={missionsFooterStyle} aria-label="Minhas Missões">
            <div style={missionsTrackStyle}>
                {missoes.map((missao, index) => {
                    const isCurrent = missao.id === currentMissionId;

                    return (
                        <MissionCard
                            key={missao.id}
                            cardRef={isCurrent ? currentMissionCardRef : undefined}
                            missao={missao}
                            displayIndex={index + 1}
                            isCurrent={isCurrent}
                            isCompleted={missao.concluida}
                            hasShareProduct={Boolean(currentProduct)}
                            onNavigateToCurtidas={onNavigateToCurtidas}
                            onShareCurrentProduct={onShareCurrentProduct}
                        />
                    );
                })}
            </div>
        </footer>
    );
}

interface MissionCardProps {
    cardRef?: Ref<HTMLElement>;
    missao: Missao;
    displayIndex: number;
    isCurrent: boolean;
    isCompleted: boolean;
    hasShareProduct: boolean;
    onNavigateToCurtidas?: (mode?: CurtidasMode) => void;
    onShareCurrentProduct: () => Promise<void>;
}

function MissionCard({
    cardRef,
    missao,
    displayIndex,
    isCurrent,
    isCompleted,
    hasShareProduct,
    onNavigateToCurtidas,
    onShareCurrentProduct,
}: MissionCardProps) {
    const Icon = missionIconMap[missao.icone] ?? Heart;
    const progress = Math.min(missao.progresso, missao.meta);
    const isCompact = missao.meta > 3;
    const filledColor = missao.icone === 'heart' ? '#ff5757' : '#687152';
    const title = isCurrent ? 'MISSÃO ATUAL' : missao.titulo;
    const isMuted = !isCurrent;
    const missionAction = isCurrent ? getMissionAction({
        missao,
        hasShareProduct,
        onNavigateToCurtidas,
        onShareCurrentProduct,
    }) : null;

    return (
        <article
            ref={cardRef}
            style={{
                ...missionCardStyle,
                ...(isCurrent ? missionCardCurrentStyle : missionCardMutedStyle),
            }}
        >
            <div style={missionTextStyle}>
                <div style={missionTitleRowStyle}>
                    <span style={{
                        ...missionBadgeStyle,
                        background: isCurrent
                            ? 'rgba(255, 255, 255, 0.94)'
                            : 'rgba(255, 255, 255, 0.18)',
                        color: isCurrent ? '#2f3328' : 'rgba(255, 255, 255, 0.55)',
                    }}>
                        {displayIndex}
                    </span>
                    <strong
                        style={{
                            ...missionTitleStyle,
                            color: isCurrent ? '#ffffff' : 'rgba(255, 255, 255, 0.48)',
                        }}
                    >
                        {title}
                    </strong>
                    {isCompleted && (
                        <CheckCircle2
                            size={12}
                            color="rgba(255, 255, 255, 0.42)"
                            fill="rgba(255, 255, 255, 0.42)"
                            strokeWidth={0}
                        />
                    )}
                </div>
                <p
                    style={{
                        ...missionDescriptionStyle,
                        color: isCurrent
                            ? 'rgba(255, 255, 255, 0.72)'
                            : 'rgba(255, 255, 255, 0.38)',
                    }}
                >
                    {missao.descricao}
                </p>
            </div>

            <div style={missionControlStyle}>
                <div
                    style={{
                        ...missionLevelsStyle,
                        ...(isCompact ? missionLevelsCompactStyle : null),
                        opacity: isMuted ? 0.5 : 1,
                    }}
                    aria-label={`${progress} de ${missao.meta} níveis`}
                >
                    {isCompact && (
                        <span
                            style={{
                                ...missionProgressCounterStyle,
                                color: isCurrent
                                    ? 'rgba(255, 255, 255, 0.74)'
                                    : 'rgba(255, 255, 255, 0.38)',
                            }}
                        >
                            {progress}/{missao.meta}
                        </span>
                    )}
                    <div style={isCompact ? missionIconsScrollStyle : missionIconsInlineStyle}>
                        {Array.from({ length: missao.meta }, (_, levelIndex) => {
                            const isFilled = levelIndex < progress;
                            const emptyIconColor = isCurrent
                                ? 'rgba(255, 255, 255, 0.66)'
                                : 'rgba(255, 255, 255, 0.32)';

                            return (
                                <Icon
                                    key={levelIndex}
                                    size={15}
                                    strokeWidth={1.7}
                                    color={isFilled ? filledColor : emptyIconColor}
                                    fill={isFilled ? filledColor : 'none'}
                                    style={missionIconStyle}
                                    aria-hidden="true"
                                />
                            );
                        })}
                    </div>
                </div>
                {missionAction && (
                    <button
                        type="button"
                        disabled={missionAction.disabled}
                        onClick={missionAction.onClick}
                        style={{
                            ...missionActionButtonStyle,
                            opacity: missionAction.disabled ? 0.45 : 1,
                            cursor: missionAction.disabled ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {missionAction.icon}
                        {missionAction.label}
                    </button>
                )}
            </div>
        </article>
    );
}

interface MissionActionParams {
    missao: Missao;
    hasShareProduct: boolean;
    onNavigateToCurtidas?: (mode?: CurtidasMode) => void;
    onShareCurrentProduct: () => Promise<void>;
}

interface MissionAction {
    label: string;
    onClick: () => void;
    disabled: boolean;
    icon?: React.ReactNode;
}

function getMissionAction({
    missao,
    hasShareProduct,
    onNavigateToCurtidas,
    onShareCurrentProduct,
}: MissionActionParams): MissionAction | null {
    if (missao.tipo === 'CURTIR_ITEM' && missao.concluida) {
        return {
            label: 'Acessar curtidas',
            onClick: () => onNavigateToCurtidas?.('lista'),
            disabled: !onNavigateToCurtidas,
        };
    }

    if (!missao.ativa) return null;

    if (missao.tipo === 'COMPARTILHAR_ITEM' && !missao.concluida) {
        return {
            label: 'Compartilhar',
            icon: <Share2 size={10} />,
            onClick: () => {
                void onShareCurrentProduct().catch(() => undefined);
            },
            disabled: !hasShareProduct,
        };
    }

    if (missao.tipo === 'COMPRAR_ITEM') {
        return {
            label: 'Ir para curtidas',
            onClick: () => onNavigateToCurtidas?.('lista'),
            disabled: !onNavigateToCurtidas,
        };
    }

    if (missao.tipo === 'USAR_TENTATIVA') {
        return {
            label: 'Usar tentativa',
            onClick: () => onNavigateToCurtidas?.('resgate'),
            disabled: !onNavigateToCurtidas,
        };
    }

    return null;
}

async function copyShareTextToClipboard(text: string) {
    if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        document.execCommand('copy');
    } finally {
        document.body.removeChild(textarea);
    }
}

interface NamePromptModalProps {
    profileName: string;
    profileNameError: string;
    isSavingProfileName: boolean;
    onProfileNameChange: (name: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

function NamePromptModal({
    profileName,
    profileNameError,
    isSavingProfileName,
    onProfileNameChange,
    onSubmit,
}: NamePromptModalProps) {
    return (
        <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-name-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={modalOverlayStyle}
        >
            <motion.form
                onSubmit={onSubmit}
                noValidate
                initial={{ y: 18, scale: 0.96 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 14, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                style={modalCardStyle}
            >
                <h2 id="profile-name-title" style={modalTitleStyle}>
                    Qual é o seu nome?
                </h2>
                <p style={modalDescriptionStyle}>
                    Assim conseguimos deixar seus matchs e ofertas com a sua cara.
                </p>
                <input
                    value={profileName}
                    onChange={(event) => onProfileNameChange(event.target.value)}
                    placeholder="Digite seu nome"
                    autoComplete="name"
                    style={modalInputStyle}
                />
                {profileNameError && (
                    <p role="alert" style={modalErrorStyle}>
                        {profileNameError}
                    </p>
                )}
                <button type="submit" disabled={isSavingProfileName} style={{
                    ...modalSubmitStyle,
                    cursor: isSavingProfileName ? 'wait' : 'pointer',
                    opacity: isSavingProfileName ? 0.72 : 1,
                }}>
                    {isSavingProfileName ? 'Salvando...' : 'Continuar'}
                </button>
            </motion.form>
        </motion.div>
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
        <div role="status" style={messageStyle}>
            <strong style={{ fontSize: '18px' }}>{title}</strong>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                {description}
            </span>
            {actionLabel && onAction && (
                <button type="button" onClick={onAction} style={messageButtonStyle}>
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

const missionIconMap: Record<string, LucideIcon> = {
    heart: Heart,
    sparkles: Sparkles,
    'shopping-bag': ShoppingBag,
    star: Star,
};

const screenStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    width: '100%',
    maxWidth: '430px',
    height: '100dvh',
    flexDirection: 'column',
    margin: '0 auto',
    overflow: 'hidden',
    background: '#FAF7F2',
    color: 'var(--text-dark)',
    fontFamily: "'DM Sans', sans-serif",
    padding: '7px 4px 7px',
};

const stackSectionStyle: CSSProperties = {
    position: 'relative',
    flex: 1,
    minHeight: 0,
    padding: 0,
    borderRadius: '9px',
    overflow: 'hidden',
};

const matchAlertStyle: CSSProperties = {
    position: 'absolute',
    top: '54px',
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
};

const matchCloseButtonStyle: CSSProperties = {
    display: 'grid',
    width: '28px',
    height: '28px',
    padding: 0,
    border: 0,
    placeItems: 'center',
    color: 'inherit',
    background: 'transparent',
    cursor: 'pointer',
};

const missionsFooterStyle: CSSProperties = {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '100%',
    margin: '0 auto',
    padding: '0 8px',
    background: 'transparent',
};

const missionsTrackStyle: CSSProperties = {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    overflowY: 'hidden',
    paddingTop: '0',
    scrollSnapType: 'x proximity',
    scrollbarWidth: 'none',
};

const missionCardStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    alignItems: 'center',
    gap: '8px',
    width: 'min(164px, calc(100vw - 18px))',
    minWidth: '164px',
    minHeight: '43px',
    flex: '0 0 auto',
    borderRadius: '8px',
    background: 'rgba(20, 20, 20, 0.76)',
    border: 0,
    boxShadow: 'none',
    padding: '7px 9px',
    scrollSnapAlign: 'start',
    backdropFilter: 'blur(8px)',
};

const missionCardCurrentStyle: CSSProperties = {
    opacity: 1,
    background: 'rgba(18, 18, 18, 0.78)',
};

const missionCardMutedStyle: CSSProperties = {
    opacity: 0.55,
    background: 'rgba(255, 255, 255, 0.15)',
    boxShadow: 'none',
};

const missionTextStyle: CSSProperties = {
    minWidth: 0,
};

const missionTitleRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
};

const missionBadgeStyle: CSSProperties = {
    display: 'grid',
    width: '14px',
    height: '14px',
    placeItems: 'center',
    borderRadius: '999px',
    background: '#2f3328',
    color: '#ffffff',
    fontSize: '7px',
    fontWeight: 900,
};

const missionTitleStyle: CSSProperties = {
    overflow: 'hidden',
    color: '#5f635a',
    fontSize: '9px',
    fontWeight: 900,
    letterSpacing: '0.04em',
    lineHeight: 1,
    textOverflow: 'ellipsis',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
};

const missionDescriptionStyle: CSSProperties = {
    margin: '4px 0 0',
    overflow: 'hidden',
    color: '#8b8d85',
    fontSize: '8px',
    fontWeight: 700,
    lineHeight: 1.1,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
};

const missionControlStyle: CSSProperties = {
    display: 'flex',
    maxWidth: '72px',
    minWidth: 0,
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
};

const missionLevelsStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    minWidth: 0,
    maxWidth: '72px',
};

const missionLevelsCompactStyle: CSSProperties = {
    width: '72px',
    maxWidth: '72px',
};

const missionProgressCounterStyle: CSSProperties = {
    flex: '0 0 auto',
    color: '#687152',
    fontSize: '8px',
    fontWeight: 900,
    lineHeight: 1,
    whiteSpace: 'nowrap',
};

const missionIconsInlineStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexWrap: 'nowrap',
};

const missionIconsScrollStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    maxWidth: '39px',
    minWidth: 0,
    overflowX: 'auto',
    overflowY: 'hidden',
    flexWrap: 'nowrap',
    scrollbarWidth: 'none',
};

const missionIconStyle: CSSProperties = {
    flex: '0 0 auto',
};

const missionActionButtonStyle: CSSProperties = {
    display: 'inline-flex',
    maxWidth: '96px',
    minHeight: '20px',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
    overflow: 'hidden',
    border: 0,
    borderRadius: '999px',
    background: '#687152',
    color: '#ffffff',
    padding: '4px 7px',
    fontSize: '8px',
    fontWeight: 900,
    lineHeight: 1,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
};

const modalOverlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 1200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'rgba(26, 26, 26, 0.38)',
    backdropFilter: 'blur(8px)',
};

const modalCardStyle: CSSProperties = {
    width: 'min(100%, 342px)',
    borderRadius: '26px',
    background: 'var(--background-app)',
    padding: '24px',
    boxShadow: '0 22px 48px rgba(25, 21, 16, 0.24)',
    textAlign: 'center',
};

const modalTitleStyle: CSSProperties = {
    margin: 0,
    color: 'var(--text-dark)',
    fontSize: '22px',
    fontWeight: 800,
    letterSpacing: '-0.03em',
};

const modalDescriptionStyle: CSSProperties = {
    margin: '8px 0 18px',
    color: 'var(--text-muted)',
    fontSize: '13px',
    lineHeight: 1.45,
};

const modalInputStyle: CSSProperties = {
    width: '100%',
    border: '1px solid var(--border-subtle)',
    borderRadius: '16px',
    background: '#fffefc',
    color: 'var(--text-dark)',
    font: 'inherit',
    fontSize: '15px',
    outline: 'none',
    padding: '14px 15px',
};

const modalErrorStyle: CSSProperties = {
    margin: '10px 0 0',
    color: '#b42318',
    fontSize: '12px',
    fontWeight: 700,
    lineHeight: 1.35,
    textAlign: 'left',
};

const modalSubmitStyle: CSSProperties = {
    width: '100%',
    minHeight: '52px',
    marginTop: '18px',
    border: 0,
    borderRadius: '16px',
    background: '#687152',
    color: '#fff',
    font: 'inherit',
    fontSize: '14px',
    fontWeight: 800,
    transition: 'var(--transition-smooth)',
};

const messageStyle: CSSProperties = {
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
};

const messageButtonStyle: CSSProperties = {
    marginTop: '6px',
    padding: '10px 18px',
    border: 0,
    borderRadius: 'var(--radius-button)',
    color: 'var(--color-action-button)',
    background: 'var(--color-success-badge)',
    transition: 'var(--transition-smooth)',
    fontWeight: 700,
    cursor: 'pointer',
};
