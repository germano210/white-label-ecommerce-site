/**
 * MissionsRail renderiza o progresso oficial de missões salvo no Zustand.
 * O componente não calcula progresso por ações locais: ele apenas consome
 * `missao.progresso` e `missao.concluida`, que são normalizados a partir da API.
 * Por isso pode ser usado tanto dentro do swipe quanto como rail global nas
 * demais páginas, mantendo a mesma reação visual quando a store é atualizada.
 */
import {
    useEffect,
    useMemo,
    useRef,
    type CSSProperties,
    type ReactNode,
    type Ref,
} from 'react';
import { CheckCircle2, Share2 } from 'lucide-react';
import { type ProdutoVitrine } from '../../store/useCartStore';
import { type CurtidasMode } from '../../store/useDiscoveryStore';
import { type Missao, useMissaoStore } from '../../store/useMissaoStore';
import { appIconMap } from '../../constants/iconMap';
import { AppIcon } from '../icons/AppIcon';

interface MissionsRailProps {
    currentProduct: ProdutoVitrine | null;
    onNavigateToCurtidas?: (mode?: CurtidasMode) => void;
    onShareCurrentProduct: () => Promise<void>;
}

export function MissionsRail({
    currentProduct,
    onNavigateToCurtidas,
    onShareCurrentProduct,
}: MissionsRailProps) {
    const missoes = useMissaoStore((state) => state.missoes);
    const fetchMissoes = useMissaoStore((state) => state.fetchMissoes);
    const currentMissionCardRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (missoes.length > 0) return;
        void fetchMissoes();
    }, [fetchMissoes, missoes.length]);

    const orderedMissoes = useMemo(() => {
        return [
            ...missoes.filter((missao) => !missao.concluida),
            ...missoes.filter((missao) => missao.concluida),
        ];
    }, [missoes]);

    const currentMissionId = useMemo(() => {
        return orderedMissoes.find((missao) => !missao.concluida)?.id ?? null;
    }, [orderedMissoes]);

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

    if (orderedMissoes.length === 0) return null;

    return (
        <footer style={missionsFooterStyle} aria-label="Minhas Missões">
            <div style={missionsTrackStyle}>
                {orderedMissoes.map((missao, index) => {
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
    const progress = Math.min(missao.progresso, missao.meta);
    const isCompact = missao.meta > 3;
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
            <span style={{
                ...missionBadgeStyle,
                background: isCurrent
                    ? 'rgba(255, 255, 255, 0.94)'
                    : 'rgba(255, 255, 255, 0.18)',
                color: isCurrent ? '#2f3328' : 'rgba(255, 255, 255, 0.55)',
            }}>
                {displayIndex}
            </span>

            <div style={missionTextStyle}>
                <div style={missionTitleRowStyle}>
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
                                <AppIcon
                                    key={levelIndex}
                                    name={isFilled
                                        ? appIconMap['coracao-preenchido']
                                        : appIconMap['coracao-vazado']}
                                    size={13}
                                    style={{
                                        ...missionIconStyle,
                                        color: isFilled ? '#ff4f64' : emptyIconColor,
                                    }}
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
    icon?: ReactNode;
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
    gridTemplateColumns: 'auto minmax(0, auto) auto',
    alignItems: 'center',
    columnGap: '6px',
    width: 'fit-content',
    maxWidth: 'calc(100vw - 24px)',
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
    maxWidth: 'calc(100vw - 122px)',
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
    aspectRatio: '1 / 1',
    flex: '0 0 14px',
    placeItems: 'center',
    borderRadius: '999px',
    background: '#2f3328',
    color: '#ffffff',
    fontSize: '7px',
    fontWeight: 900,
};

const missionTitleStyle: CSSProperties = {
    minWidth: 0,
    overflow: 'hidden',
    color: '#5f635a',
    fontSize: '9px',
    fontWeight: 900,
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
    flex: '0 0 auto',
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
