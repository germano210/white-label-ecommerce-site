/**
 * DiscoveryScreen concentra a nova composição mobile-first da vitrine.
 * O card de produto continua usando a pilha de swipe existente, enquanto o
 * rodapé fixo de missões escuta Zustand e atualiza os níveis preenchidos a
 * cada curtida sem duplicar estado local.
 */
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
    type CSSProperties,
    type FormEvent,
    type MouseEventHandler,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    CheckCircle2,
    Heart,
    Menu,
    ShoppingBag,
    Sparkles,
    Star,
    X,
    type LucideIcon,
} from 'lucide-react';
import { SwipeCard } from '../components/domain/SwipeCard';
import { type ProdutoVitrine } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useDiscoveryStore } from '../store/useDiscoveryStore';
import { type Missao, useMissaoStore } from '../store/useMissaoStore';
import { api } from '../utils/api';
import { apiRoutes } from '../utils/apiRoutes';

interface DiscoveryScreenProps {
    onLogoDoubleClick?: MouseEventHandler<HTMLButtonElement>;
}

export function DiscoveryScreen({ onLogoDoubleClick }: DiscoveryScreenProps) {
    const products = useDiscoveryStore((state) => state.products);
    const isLoading = useDiscoveryStore((state) => state.isProductsLoading);
    const error = useDiscoveryStore((state) => state.productsError);
    const fetchProducts = useDiscoveryStore((state) => state.fetchProducts);
    const removeProductFromStack = useDiscoveryStore((state) => state.removeProductFromStack);
    const restoreProductToStack = useDiscoveryStore((state) => state.restoreProductToStack);
    const activeCategory = useDiscoveryStore((state) => state.activeCategory);
    const swipeRight = useDiscoveryStore((state) => state.swipeRight);
    const swipeLeft = useDiscoveryStore((state) => state.swipeLeft);
    const undoLastSwipe = useDiscoveryStore((state) => state.undoLastSwipe);
    const matchAlertVisible = useDiscoveryStore((state) => state.matchAlertVisible);
    const dismissMatchAlert = useDiscoveryStore((state) => state.dismissMatchAlert);
    const namePromptVisible = useDiscoveryStore((state) => state.namePromptVisible);
    const dismissNamePrompt = useDiscoveryStore((state) => state.dismissNamePrompt);
    const updateUser = useAuthStore((state) => state.updateUser);
    const [profileName, setProfileName] = useState('');
    const [profileNameError, setProfileNameError] = useState('');
    const [isSavingProfileName, setIsSavingProfileName] = useState(false);

    useEffect(() => {
        void fetchProducts();
    }, [fetchProducts]);

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

    const handleSwipe = useCallback((
        product: ProdutoVitrine,
        direction: 'like' | 'dislike',
    ) => {
        removeProductFromStack(product.id);

        switch (direction) {
            case 'dislike':
                swipeLeft(product);
                break;

            case 'like':
                swipeRight(product);
                void api.post(apiRoutes.curtidas.create(product.id)).catch(() => {
                    // Mantém o swipe otimista para não interromper a experiência.
                });
                break;
        }
    }, [removeProductFromStack, swipeLeft, swipeRight]);

    const handleUndo = useCallback(() => {
        const restoredProduct = undoLastSwipe();
        if (!restoredProduct) return;

        restoreProductToStack(restoredProduct);
    }, [restoreProductToStack, undoLastSwipe]);

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
            <DiscoveryHeader onLogoDoubleClick={onLogoDoubleClick} />

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
                        onAction={() => void fetchProducts()}
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
            </section>

            <MissionsRail />
        </main>
    );
}

interface DiscoveryHeaderProps {
    onLogoDoubleClick?: MouseEventHandler<HTMLButtonElement>;
}

function DiscoveryHeader({ onLogoDoubleClick }: DiscoveryHeaderProps) {
    return (
        <header style={headerStyle}>
            <div style={topNavStyle}>
                <button
                    type="button"
                    onDoubleClick={onLogoDoubleClick}
                    aria-label="Brechó da Cami"
                    style={brandButtonStyle}
                >
                    <span>Brechó</span>
                    <span>da Cami</span>
                </button>

                <button type="button" aria-label="Abrir menu" style={iconButtonStyle}>
                    <Menu size={21} strokeWidth={2} />
                </button>
            </div>
        </header>
    );
}

/**
 * O rail de missões usa overflow-x auto com cards flexíveis e largura fixa.
 * Assim o rodapé permanece preso à thumb zone, enquanto o usuário desliza
 * horizontalmente entre missões sem reduzir a área vertical do card principal.
 */
function MissionsRail() {
    const missoes = useMissaoStore((state) => state.missoes);
    const fetchMissoes = useMissaoStore((state) => state.fetchMissoes);
    const likedItemsCount = useDiscoveryStore((state) => state.likedItems.length);

    useEffect(() => {
        void fetchMissoes();
    }, [fetchMissoes]);

    return (
        <footer style={missionsFooterStyle} aria-label="Minhas Missões">
            <div style={missionsTrackStyle}>
                {missoes.map((missao, index) => (
                    <MissionCard
                        key={missao.id}
                        missao={missao}
                        index={index}
                        likedItemsCount={likedItemsCount}
                    />
                ))}
            </div>
        </footer>
    );
}

interface MissionCardProps {
    missao: Missao;
    index: number;
    likedItemsCount: number;
}

function MissionCard({ missao, index, likedItemsCount }: MissionCardProps) {
    const Icon = missionIconMap[missao.icone] ?? Heart;
    const isLikeMission = /curtid|like/i.test(`${missao.tipo} ${missao.descricao}`);
    const progress = Math.min(isLikeMission ? likedItemsCount : missao.progresso, missao.meta);

    return (
        <article
            style={{
                ...missionCardStyle,
                opacity: index === 0 ? 1 : 0.38,
            }}
        >
            <div style={missionTextStyle}>
                <div style={missionTitleRowStyle}>
                    <span style={missionBadgeStyle}>{index + 1}</span>
                    <strong style={missionTitleStyle}>{missao.titulo}</strong>
                </div>
                <p style={missionDescriptionStyle}>{missao.descricao}</p>
            </div>

            <div style={missionLevelsStyle} aria-label={`${progress} de ${missao.meta} níveis`}>
                {Array.from({ length: missao.meta }, (_, levelIndex) => {
                    const isFilled = levelIndex < progress;
                    const filledColor = missao.icone === 'heart' ? '#ff5757' : '#687152';

                    return (
                        <Icon
                            key={levelIndex}
                            size={15}
                            strokeWidth={1.7}
                            color={isFilled ? filledColor : '#2f3328'}
                            fill={isFilled ? filledColor : 'none'}
                            aria-hidden="true"
                        />
                    );
                })}
            </div>
        </article>
    );
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
    padding: '6px 4px 60px',
};

const headerStyle: CSSProperties = {
    flex: '0 0 auto',
    margin: '0 3px 5px',
    borderRadius: 0,
    background: 'transparent',
    boxShadow: 'none',
    padding: '5px 4px 2px',
};

const topNavStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 32px',
    alignItems: 'center',
    minHeight: '31px',
};

const iconButtonStyle: CSSProperties = {
    display: 'grid',
    width: '28px',
    height: '28px',
    justifySelf: 'end',
    placeItems: 'center',
    border: 0,
    borderRadius: '999px',
    color: '#2f3328',
    background: 'transparent',
    boxShadow: 'none',
    cursor: 'pointer',
};

const brandButtonStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: 0,
    border: 0,
    color: '#687152',
    background: 'transparent',
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '14px',
    fontStyle: 'italic',
    fontWeight: 700,
    lineHeight: 0.76,
    cursor: 'pointer',
};

const stackSectionStyle: CSSProperties = {
    position: 'relative',
    flex: 1,
    minHeight: 0,
    padding: 0,
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
    position: 'fixed',
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1000,
    width: '100%',
    maxWidth: '430px',
    margin: '0 auto',
    padding: '0 7px max(7px, env(safe-area-inset-bottom))',
    background: 'linear-gradient(180deg, rgba(250,247,242,0) 0%, #FAF7F2 24%)',
};

const missionsTrackStyle: CSSProperties = {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    overflowY: 'hidden',
    paddingTop: '5px',
    scrollSnapType: 'x proximity',
};

const missionCardStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    alignItems: 'center',
    gap: '8px',
    width: 'min(220px, calc(100vw - 14px))',
    minWidth: '220px',
    minHeight: '45px',
    flex: '0 0 auto',
    borderRadius: '10px',
    background: '#ffffff',
    boxShadow: '0 7px 18px rgba(25, 21, 16, 0.10)',
    padding: '9px 12px',
    scrollSnapAlign: 'start',
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
    width: '13px',
    height: '13px',
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

const missionLevelsStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
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
