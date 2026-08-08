import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent, type UIEvent } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { BrechoDaCamiLogo } from '../components/common/BrechoDaCamiLogo';
import { useAuthStore } from '../store/useAuthStore';
import { api, isCookieAuthMode } from '../utils/api';
import { apiRoutes } from '../utils/apiRoutes';
import { getImageUrl } from '../utils/imageUtils';
import './RoletaVipScreen.css';

type NumericApiValue = number | string | null | undefined;
type RoletaTab = 'spin' | 'daily';
type RoletaTipoPremio = 'DESCONTO_VALOR' | 'DESCONTO_PERCENTUAL' | 'GIRO_EXTRA' | 'SEM_PREMIO';

type RoletaNotificacaoApi = string | {
    texto?: string | null;
    nomeRoupa?: string | null;
    nome_roupa?: string | null;
    nomeProduto?: string | null;
    nome_produto?: string | null;
    produtoNome?: string | null;
    produto_nome?: string | null;
    itemNome?: string | null;
    item_nome?: string | null;
    roupa?: {
        nome?: string | null;
    } | null;
    produto?: {
        nome?: string | null;
    } | null;
};

interface RoletaPremioApi {
    id?: number | string | null;
    titulo?: string | null;
    descricao?: string | null;
    tipoPremio?: RoletaTipoPremio | string | null;
    tipo_premio?: RoletaTipoPremio | string | null;
    valor?: NumericApiValue;
    valorPremio?: NumericApiValue;
    valor_premio?: NumericApiValue;
    valorMinimo?: NumericApiValue;
    valor_minimo?: NumericApiValue;
    valorMaximo?: NumericApiValue;
    valor_maximo?: NumericApiValue;
    valorFormatado?: string | null;
    valor_formatado?: string | null;
    girosExtras?: NumericApiValue;
    giros_extras?: NumericApiValue;
    nivel?: number | string | null;
    nivelNome?: string | null;
    nivel_nome?: string | null;
    corHex?: string | null;
    cor_hex?: string | null;
}

interface RoletaNivelApi {
    id?: number | string | null;
    nome?: string | null;
    titulo?: string | null;
    descricao?: string | null;
    corHex?: string | null;
    cor_hex?: string | null;
    ordem?: number | string | null;
    nivel?: number | string | null;
    ativo?: boolean | number | string | null;
    ativa?: boolean | number | string | null;
    premios?: RoletaPremioApi[] | null;
    opcoes?: RoletaPremioApi[] | null;
}

type RoletaOpcaoApi = string | {
    id?: number | string | null;
    label?: string | null;
    titulo?: string | null;
    texto?: string | null;
    nome?: string | null;
    descricao?: string | null;
    valorFormatado?: string | null;
    valor_formatado?: string | null;
    nivel?: number | string | null;
    nivelNome?: string | null;
    nivel_nome?: string | null;
    corHex?: string | null;
    cor_hex?: string | null;
    ordem?: number | string | null;
    ativo?: boolean | number | string | null;
    ativa?: boolean | number | string | null;
    tipoPremio?: RoletaTipoPremio | string | null;
    tipo_premio?: RoletaTipoPremio | string | null;
    valor?: NumericApiValue;
    valorPremio?: NumericApiValue;
    valor_premio?: NumericApiValue;
    valorMinimo?: NumericApiValue;
    valor_minimo?: NumericApiValue;
    valorMaximo?: NumericApiValue;
    valor_maximo?: NumericApiValue;
};

interface RoletaStatusApi {
    ativa?: boolean | null;
    titulo?: string | null;
    girosTotaisObtidos?: NumericApiValue;
    giros_totais_obtidos?: NumericApiValue;
    girosDisponiveis?: NumericApiValue;
    giros_disponiveis?: NumericApiValue;
    valorDisponivelResgate?: NumericApiValue;
    valor_disponivel_resgate?: NumericApiValue;
    metaGrupo?: NumericApiValue;
    meta_grupo?: NumericApiValue;
    progressoGrupo?: NumericApiValue;
    progresso_grupo?: NumericApiValue;
    girosBonusGrupo?: NumericApiValue;
    giros_bonus_grupo?: NumericApiValue;
    notificacoes?: RoletaNotificacaoApi[] | null;
    ultimosEventos?: string[] | null;
    niveis?: RoletaNivelApi[] | null;
    niveisRoleta?: RoletaNivelApi[] | null;
    niveis_roleta?: RoletaNivelApi[] | null;
    opcoes?: RoletaOpcaoApi[] | null;
    fatias?: RoletaOpcaoApi[] | null;
    premiosEmJogo?: RoletaOpcaoApi[] | null;
    premios_em_jogo?: RoletaOpcaoApi[] | null;
}

interface RoletaGiroResponse {
    premio?: RoletaPremioApi | null;
    premioSorteado?: RoletaPremioApi | null;
    premio_sorteado?: RoletaPremioApi | null;
    opcaoSorteada?: RoletaOpcaoApi | null;
    opcao_sorteada?: RoletaOpcaoApi | null;
    girosDisponiveis?: NumericApiValue;
    giros_disponiveis?: NumericApiValue;
    roleta?: RoletaStatusApi | null;
}

interface RoletaWheelSlice {
    id: string;
    label: string;
    color: string;
    order: number;
    level: number;
}

interface RoletaSpinResult {
    nivelNome: string;
    nivelCor: string;
    premioTitulo: string;
    premioDescricao: string;
    valorLabel: string;
}

type ProdutoImagemApi = string | {
    id?: number | string | null;
    url?: string | null;
    imagemUrl?: string | null;
    imagem_url?: string | null;
    caminho?: string | null;
    path?: string | null;
    principal?: boolean | number | string | null;
    ordem?: number | string | null;
};

interface RoletaProdutoApi {
    id?: number | string | null;
    produtoId?: number | string | null;
    produto_id?: number | string | null;
    nome?: string | null;
    titulo?: string | null;
    tamanho?: string | null;
    preco?: NumericApiValue;
    precoVenda?: NumericApiValue;
    preco_venda?: NumericApiValue;
    valor?: NumericApiValue;
    imagemUrl?: string | null;
    imagem_url?: string | null;
    imagens?: ProdutoImagemApi[] | null;
    fotos?: ProdutoImagemApi[] | null;
}

interface RoletaProdutosResponse {
    content?: RoletaProdutoApi[];
    produtos?: RoletaProdutoApi[];
    items?: RoletaProdutoApi[];
    data?: RoletaProdutoApi[];
}

interface DailyProduct {
    id: string;
    nome: string;
    tamanho: string;
    priceLabel: string;
    images: string[];
}

interface RoletaViewState {
    ativa: boolean;
    girosTotaisObtidos: number;
    girosDisponiveis: number;
    valorDisponivelResgate: number;
    metaGrupo: number;
    progressoGrupo: number;
    girosBonusGrupo: number;
    notificacoes: string[];
    opcoes: RoletaWheelSlice[];
}

const emptyRoletaState: RoletaViewState = {
    ativa: false,
    girosTotaisObtidos: 0,
    girosDisponiveis: 0,
    valorDisponivelResgate: 0,
    metaGrupo: 20,
    progressoGrupo: 0,
    girosBonusGrupo: 0,
    notificacoes: [],
    opcoes: [],
};

const rarityPresets = [
    { nome: 'Grau Militar', corHex: '#2563EB' },
    { nome: 'Restrito', corHex: '#7C3AED' },
    { nome: 'Classificado', corHex: '#E83E8C' },
    { nome: 'Encoberto / Secreto', corHex: '#DC2626' },
    { nome: 'Extremamente Raro / Ouro', corHex: '#D4A017' },
];

const DAILY_CARD_TAP_THRESHOLD = 10;

function parseApiNumber(value: NumericApiValue) {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }

    if (!value) return 0;

    const normalizedValue = value
        .replace(/[^\d,.-]/g, '')
        .replace(/\.(?=\d{3}(?:\D|$))/g, '')
        .replace(',', '.');

    return Number(normalizedValue) || 0;
}

function formatTwoDigits(value: number) {
    return Math.max(0, Math.floor(value)).toString().padStart(2, '0');
}

function formatCurrencyBRL(value: number) {
    return value
        .toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        })
        .replace(/\s/g, '');
}

function toBoolean(value: boolean | number | string | null | undefined, fallback = true) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const normalizedValue = value.trim().toLowerCase();
        if (normalizedValue === 'true' || normalizedValue === '1') return true;
        if (normalizedValue === 'false' || normalizedValue === '0') return false;
    }

    return fallback;
}

function normalizeHexColor(value: string | null | undefined, fallback: string) {
    const normalizedValue = value?.trim();
    if (normalizedValue && /^#[0-9a-fA-F]{6}$/.test(normalizedValue)) {
        return normalizedValue;
    }

    return fallback;
}

function isOptionObject(option: RoletaOpcaoApi | null | undefined): option is Exclude<RoletaOpcaoApi, string> {
    return typeof option === 'object' && option !== null;
}

function normalizeNotification(notification: RoletaNotificacaoApi) {
    if (typeof notification === 'string') return notification.trim();

    const directText = notification.texto?.trim();
    if (directText) return directText;

    const productName = (
        notification.nomeRoupa
        ?? notification.nome_roupa
        ?? notification.nomeProduto
        ?? notification.nome_produto
        ?? notification.produtoNome
        ?? notification.produto_nome
        ?? notification.itemNome
        ?? notification.item_nome
        ?? notification.roupa?.nome
        ?? notification.produto?.nome
        ?? ''
    ).trim();

    return productName ? `Um membro resgatou a ${productName}` : '';
}

function getOptionLabel(option: RoletaOpcaoApi, index: number) {
    if (typeof option === 'string') return option.trim() || `Opcao ${index + 1}`;

    return (
        option.label
        ?? option.titulo
        ?? option.texto
        ?? option.nome
        ?? option.valorFormatado
        ?? option.valor_formatado
        ?? `Opcao ${index + 1}`
    ).trim();
}

function normalizeWheelSlicesFromLevels(levels: RoletaNivelApi[]) {
    return levels
        .filter((level) => toBoolean(level.ativo ?? level.ativa, true))
        .map((level, index) => {
            const preset = rarityPresets[index % rarityPresets.length];
            const order = Math.max(1, Math.floor(parseApiNumber(level.ordem ?? level.nivel ?? index + 1)));

            return {
                id: String(level.id ?? `nivel-${order}`),
                label: (level.nome ?? level.titulo ?? preset.nome).trim(),
                color: normalizeHexColor(level.corHex ?? level.cor_hex, preset.corHex),
                order,
                level: Math.max(1, Math.floor(parseApiNumber(level.nivel ?? order))),
            };
        })
        .sort((a, b) => a.order - b.order);
}

function normalizeWheelSlicesFromFlatOptions(options: RoletaOpcaoApi[]) {
    const groups = new Map<number, RoletaWheelSlice>();
    const directSlices: RoletaWheelSlice[] = [];

    options.forEach((option, index) => {
        if (!isOptionObject(option)) {
            const preset = rarityPresets[index % rarityPresets.length];
            directSlices.push({
                id: `opcao-${index}`,
                label: getOptionLabel(option, index),
                color: preset.corHex,
                order: index + 1,
                level: index + 1,
            });
            return;
        }

        if (!toBoolean(option.ativo ?? option.ativa, true)) return;

        const level = Math.max(1, Math.floor(parseApiNumber(option.nivel ?? index + 1)));
        const preset = rarityPresets[(level - 1) % rarityPresets.length];
        const currentGroup = groups.get(level);

        if (currentGroup) return;

        groups.set(level, {
            id: String(option.id ?? `nivel-${level}`),
            label: (
                option.nivelNome
                ?? option.nivel_nome
                ?? preset.nome
                ?? getOptionLabel(option, index)
            ).trim(),
            color: normalizeHexColor(option.corHex ?? option.cor_hex, preset.corHex),
            order: Math.max(1, Math.floor(parseApiNumber(option.ordem ?? level))),
            level,
        });
    });

    if (groups.size > 0) {
        return Array.from(groups.values()).sort((a, b) => a.order - b.order);
    }

    return directSlices;
}

function normalizeWheelSlices(data?: RoletaStatusApi | null) {
    const rawLevels = data?.niveis ?? data?.niveisRoleta ?? data?.niveis_roleta ?? [];
    if (rawLevels.length > 0) {
        return normalizeWheelSlicesFromLevels(rawLevels);
    }

    const rawWheelOptions = data?.opcoes ?? data?.fatias ?? data?.premiosEmJogo ?? data?.premios_em_jogo ?? [];
    return normalizeWheelSlicesFromFlatOptions(rawWheelOptions);
}

function normalizeRoletaStatus(data?: RoletaStatusApi | null): RoletaViewState {
    const metaGrupo = Math.max(1, Math.floor(parseApiNumber(data?.metaGrupo ?? data?.meta_grupo) || 20));
    const progressoGrupo = Math.min(
        Math.max(0, Math.floor(parseApiNumber(data?.progressoGrupo ?? data?.progresso_grupo))),
        metaGrupo,
    );
    const rawNotifications = data?.notificacoes ?? data?.ultimosEventos ?? [];

    return {
        ativa: data?.ativa ?? true,
        girosTotaisObtidos: Math.max(0, parseApiNumber(
            data?.girosTotaisObtidos ?? data?.giros_totais_obtidos,
        )),
        girosDisponiveis: Math.max(0, Math.floor(parseApiNumber(
            data?.girosDisponiveis ?? data?.giros_disponiveis,
        ))),
        valorDisponivelResgate: Math.max(0, parseApiNumber(
            data?.valorDisponivelResgate ?? data?.valor_disponivel_resgate,
        )),
        metaGrupo,
        progressoGrupo,
        girosBonusGrupo: Math.max(0, Math.floor(parseApiNumber(
            data?.girosBonusGrupo ?? data?.giros_bonus_grupo,
        ))),
        notificacoes: rawNotifications
            .map(normalizeNotification)
            .filter(Boolean),
        opcoes: normalizeWheelSlices(data),
    };
}

function getRoletaErrorMessage(error: unknown) {
    if (!axios.isAxiosError(error)) {
        return 'Nao foi possivel carregar a roleta agora.';
    }

    const responseData = error.response?.data as {
        message?: string;
        error?: string;
    } | undefined;

    return responseData?.message ?? responseData?.error ?? 'Nao foi possivel carregar a roleta agora.';
}

function createWheelGradient(slices: RoletaWheelSlice[]) {
    if (slices.length === 0) return '#E6D9D4';

    const sliceCount = Math.max(slices.length, 2);
    const sliceAngle = 360 / sliceCount;
    const segments = Array.from({ length: sliceCount }, (_, index) => {
        const color = slices[index % slices.length]?.color ?? '#46563A';
        const start = index * sliceAngle;
        const end = (index + 1) * sliceAngle;
        return `${color} ${start}deg ${end}deg`;
    });

    return `conic-gradient(from -90deg, ${segments.join(', ')})`;
}

function waitForAnimation(durationMs: number) {
    return new Promise((resolve) => {
        window.setTimeout(resolve, durationMs);
    });
}

function getPrizeValueLabel(prize?: RoletaPremioApi | null) {
    if (!prize) return '';
    if (prize.valorFormatado) return prize.valorFormatado;
    if (prize.valor_formatado) return prize.valor_formatado;

    const prizeValue = parseApiNumber(
        prize.valor
        ?? prize.valorPremio
        ?? prize.valor_premio
        ?? prize.valorMaximo
        ?? prize.valor_maximo
        ?? prize.valorMinimo
        ?? prize.valor_minimo,
    );

    const tipoPremio = prize.tipoPremio ?? prize.tipo_premio;
    if (tipoPremio === 'DESCONTO_PERCENTUAL' && prizeValue > 0) return `${prizeValue}%`;
    if (tipoPremio === 'GIRO_EXTRA') {
        const spins = parseApiNumber(prize.girosExtras ?? prize.giros_extras ?? prizeValue);
        return spins > 0 ? `${spins} giro(s)` : '';
    }
    if (prizeValue > 0) return formatCurrencyBRL(prizeValue);

    return '';
}

function createSpinResult(data: RoletaGiroResponse, slices: RoletaWheelSlice[]): RoletaSpinResult | null {
    const premio = data.premioSorteado ?? data.premio_sorteado ?? data.premio ?? null;
    const opcao = data.opcaoSorteada ?? data.opcao_sorteada ?? null;
    const optionObject = isOptionObject(opcao) ? opcao : null;
    const levelNumber = Math.max(1, Math.floor(parseApiNumber(
        premio?.nivel
        ?? optionObject?.nivel
        ?? 1,
    )));
    const matchedSlice = slices.find((slice) => slice.level === levelNumber) ?? slices[0];
    const preset = rarityPresets[(levelNumber - 1) % rarityPresets.length];
    const nivelNome = (
        premio?.nivelNome
        ?? premio?.nivel_nome
        ?? optionObject?.nivelNome
        ?? optionObject?.nivel_nome
        ?? matchedSlice?.label
        ?? preset.nome
    ).trim();
    const premioTitulo = (
        premio?.titulo
        ?? (optionObject ? getOptionLabel(optionObject, 0) : '')
        ?? 'Premio sorteado'
    ).trim();
    const premioDescricao = (
        premio?.descricao
        ?? optionObject?.descricao
        ?? ''
    ).trim();
    const valorLabel = getPrizeValueLabel(premio);

    if (!premioTitulo && !nivelNome) return null;

    return {
        nivelNome: nivelNome || 'Nivel sorteado',
        nivelCor: normalizeHexColor(
            premio?.corHex
            ?? premio?.cor_hex
            ?? optionObject?.corHex
            ?? optionObject?.cor_hex,
            matchedSlice?.color ?? preset.corHex,
        ),
        premioTitulo: premioTitulo || 'Premio sorteado',
        premioDescricao,
        valorLabel,
    };
}

function getProdutoImagePath(image: ProdutoImagemApi) {
    if (typeof image === 'string') return image;
    return image.url ?? image.imagemUrl ?? image.imagem_url ?? image.caminho ?? image.path ?? '';
}

function isPrincipalImage(value: unknown) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
    return false;
}

function normalizeDailyProductImages(product: RoletaProdutoApi) {
    const rawImages = product.imagens ?? product.fotos ?? [];
    const orderedImages = rawImages
        .map((image, index) => ({
            path: getProdutoImagePath(image),
            principal: typeof image === 'object' && image !== null
                ? isPrincipalImage(image.principal)
                : index === 0,
            ordem: typeof image === 'object' && image !== null
                ? Math.floor(parseApiNumber(image.ordem ?? index))
                : index,
        }))
        .filter((image) => image.path.trim())
        .sort((a, b) => {
            if (a.principal !== b.principal) return a.principal ? -1 : 1;
            return a.ordem - b.ordem;
        })
        .map((image) => getImageUrl(image.path));
    const fallbackImage = getImageUrl(product.imagemUrl ?? product.imagem_url);

    return orderedImages.length > 0 ? orderedImages : [fallbackImage];
}

function normalizeDailyProductsResponse(data: RoletaProdutoApi[] | RoletaProdutosResponse) {
    const rawProducts = Array.isArray(data)
        ? data
        : data.content ?? data.produtos ?? data.items ?? data.data ?? [];

    return rawProducts
        .map((product, index): DailyProduct => {
            const id = String(product.id ?? product.produtoId ?? product.produto_id ?? `daily-${index}`);
            const priceValue = parseApiNumber(
                product.precoVenda
                ?? product.preco_venda
                ?? product.preco
                ?? product.valor,
            );

            return {
                id,
                nome: (product.nome ?? product.titulo ?? 'Item diario').trim(),
                tamanho: (product.tamanho ?? 'Unico').trim(),
                priceLabel: priceValue > 0 ? formatCurrencyBRL(priceValue) : '',
                images: normalizeDailyProductImages(product),
            };
        })
        .filter((product) => product.id.trim());
}

function getClampedImageIndex(product: DailyProduct, imageIndex?: number) {
    return Math.min(Math.max(imageIndex ?? 0, 0), Math.max(product.images.length - 1, 0));
}

export function RoletaVipScreen() {
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const isAuthenticated = isCookieAuthMode ? Boolean(user) : Boolean(token && user);
    const [roleta, setRoleta] = useState<RoletaViewState>(emptyRoletaState);
    const [activeTab, setActiveTab] = useState<RoletaTab>('spin');
    const [isLoading, setIsLoading] = useState(true);
    const [isSpinning, setIsSpinning] = useState(false);
    const [wheelRotation, setWheelRotation] = useState(0);
    const [spinResult, setSpinResult] = useState<RoletaSpinResult | null>(null);
    const [error, setError] = useState('');
    const [dailyProducts, setDailyProducts] = useState<DailyProduct[]>([]);
    const [activeImageByProductId, setActiveImageByProductId] = useState<Record<string, number>>({});
    const [activeProductIndex, setActiveProductIndex] = useState(0);
    const [dailyCarouselProgress, setDailyCarouselProgress] = useState(0);
    const [expandedDailyProductId, setExpandedDailyProductId] = useState<string | null>(null);
    const [isDailyLoading, setIsDailyLoading] = useState(false);
    const [dailyError, setDailyError] = useState('');
    const [hasLoadedDailyProducts, setHasLoadedDailyProducts] = useState(false);
    const dailyCarouselRef = useRef<HTMLDivElement | null>(null);
    const dailyCardGestureRef = useRef({
        hasDragged: false,
        startX: 0,
        startY: 0,
    });

    const progressPercent = useMemo(() => (
        roleta.metaGrupo > 0 ? (roleta.progressoGrupo / roleta.metaGrupo) * 100 : 0
    ), [roleta.metaGrupo, roleta.progressoGrupo]);

    const authRefreshKey = isAuthenticated
        ? String(user?.id ?? user?.telefone ?? user?.phone ?? token ?? 'cookie-session')
        : 'guest';
    const wheelGradient = useMemo(() => createWheelGradient(roleta.opcoes), [roleta.opcoes]);
    const hasWheelOptions = roleta.opcoes.length > 0;
    const canSpin = isAuthenticated && roleta.ativa && roleta.girosDisponiveis > 0 && hasWheelOptions && !isSpinning;

    const fetchRoleta = useCallback(async () => {
        setIsLoading(true);
        setError('');

        try {
            const { data } = await api.get<RoletaStatusApi>(apiRoutes.roleta.status);
            setRoleta(normalizeRoletaStatus(data));
        } catch (roletaError) {
            if (axios.isAxiosError(roletaError) && (
                roletaError.response?.status === 401
                || roletaError.response?.status === 403
            )) {
                setRoleta(emptyRoletaState);
                return;
            }

            setError(getRoletaErrorMessage(roletaError));
            setRoleta(emptyRoletaState);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchRoleta();
    }, [authRefreshKey, fetchRoleta]);

    const fetchDailyProducts = useCallback(async () => {
        setIsDailyLoading(true);
        setDailyError('');

        try {
            const { data } = await api.get<RoletaProdutoApi[] | RoletaProdutosResponse>(apiRoutes.roleta.produtos);
            setDailyProducts(normalizeDailyProductsResponse(data));
            setActiveProductIndex(0);
            setDailyCarouselProgress(0);
            setHasLoadedDailyProducts(true);
        } catch (dailyProductsError) {
            setDailyError(getRoletaErrorMessage(dailyProductsError));
        } finally {
            setIsDailyLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'daily' && !hasLoadedDailyProducts && !isDailyLoading) {
            void fetchDailyProducts();
        }
    }, [activeTab, fetchDailyProducts, hasLoadedDailyProducts, isDailyLoading]);

    const handleSpin = async () => {
        if (!canSpin) return;

        setIsSpinning(true);
        setError('');
        setSpinResult(null);

        try {
            const { data } = await api.post<RoletaGiroResponse>(apiRoutes.roleta.girar);
            setWheelRotation((currentRotation) => currentRotation + 1800 + 72);
            await waitForAnimation(1250);

            setSpinResult(createSpinResult(data, roleta.opcoes));

            if (data.roleta) {
                setRoleta(normalizeRoletaStatus(data.roleta));
            } else if (data.girosDisponiveis !== undefined || data.giros_disponiveis !== undefined) {
                setRoleta((currentRoleta) => ({
                    ...currentRoleta,
                    girosDisponiveis: Math.max(0, Math.floor(parseApiNumber(
                        data.girosDisponiveis ?? data.giros_disponiveis,
                    ))),
                }));
            } else {
                await fetchRoleta();
            }
        } catch (spinError) {
            setError(getRoletaErrorMessage(spinError));
        } finally {
            setIsSpinning(false);
        }
    };

    const setDailyProductImage = (product: DailyProduct, direction: -1 | 1) => {
        setActiveImageByProductId((currentImages) => {
            const currentImageIndex = getClampedImageIndex(product, currentImages[product.id]);
            const nextImageIndex = getClampedImageIndex(product, currentImageIndex + direction);

            return {
                ...currentImages,
                [product.id]: nextImageIndex,
            };
        });
    };

    const selectDailyProductImage = (productId: string, imageIndex: number) => {
        setActiveImageByProductId((currentImages) => ({
            ...currentImages,
            [productId]: imageIndex,
        }));
    };

    const clampDailyCarouselProgress = (progress: number) => Math.min(Math.max(progress, 0), 1);

    const getDailyProductIndexFromProgress = (progress: number) => {
        if (dailyProducts.length <= 1) return 0;

        return Math.min(
            Math.round(clampDailyCarouselProgress(progress) * (dailyProducts.length - 1)),
            dailyProducts.length - 1,
        );
    };

    const scrollDailyCarouselToProgress = (progress: number, behavior: ScrollBehavior = 'auto') => {
        const safeProgress = clampDailyCarouselProgress(progress);
        const carousel = dailyCarouselRef.current;

        setDailyCarouselProgress(safeProgress);
        setActiveProductIndex(getDailyProductIndexFromProgress(safeProgress));

        if (!carousel) return;

        const maxScrollLeft = Math.max(carousel.scrollWidth - carousel.clientWidth, 0);
        carousel.scrollTo({
            left: safeProgress * maxScrollLeft,
            behavior,
        });
    };

    const handleDailyCarouselScroll = (event: UIEvent<HTMLDivElement>) => {
        const target = event.currentTarget;
        const maxScrollLeft = Math.max(target.scrollWidth - target.clientWidth, 0);
        setDailyCarouselProgress(maxScrollLeft > 0 ? clampDailyCarouselProgress(target.scrollLeft / maxScrollLeft) : 0);

        const carouselLeft = target.getBoundingClientRect().left;
        const nextIndex = Array.from(target.children).reduce((nearestIndex, child, childIndex) => {
            if (!(child instanceof HTMLElement)) return nearestIndex;

            const childDistance = Math.abs(child.getBoundingClientRect().left - carouselLeft);
            const currentNearest = target.children.item(nearestIndex);
            const nearestDistance = currentNearest instanceof HTMLElement
                ? Math.abs(currentNearest.getBoundingClientRect().left - carouselLeft)
                : Number.POSITIVE_INFINITY;

            return childDistance < nearestDistance ? childIndex : nearestIndex;
        }, 0);

        setActiveProductIndex(Math.min(Math.max(nextIndex, 0), Math.max(dailyProducts.length - 1, 0)));
    };

    const scrollToDailyProduct = (productIndex: number) => {
        const carousel = dailyCarouselRef.current;
        const safeProductIndex = Math.min(Math.max(productIndex, 0), Math.max(dailyProducts.length - 1, 0));
        setActiveProductIndex(safeProductIndex);
        setDailyCarouselProgress(dailyProducts.length > 1 ? safeProductIndex / (dailyProducts.length - 1) : 0);

        if (!carousel) {
            return;
        }

        const targetCard = carousel.children.item(safeProductIndex);
        if (targetCard instanceof HTMLElement) {
            const nextLeft = targetCard.getBoundingClientRect().left
                - carousel.getBoundingClientRect().left
                + carousel.scrollLeft;

            carousel.scrollTo({
                left: nextLeft,
                behavior: 'smooth',
            });
        }
    };

    const handleDailyProductBarPointer = (event: PointerEvent<HTMLDivElement>) => {
        if (event.type === 'pointermove' && event.buttons !== 1) return;
        if (dailyProducts.length === 0) return;

        if (event.type === 'pointerdown') {
            event.currentTarget.setPointerCapture(event.pointerId);
        }

        const rect = event.currentTarget.getBoundingClientRect();
        const position = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
        const progress = position / Math.max(rect.width, 1);

        scrollDailyCarouselToProgress(progress);
    };

    const handleDailyProductBarPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
        if (dailyProducts.length === 0) return;

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        const rect = event.currentTarget.getBoundingClientRect();
        const position = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
        const productIndex = getDailyProductIndexFromProgress(position / Math.max(rect.width, 1));
        scrollToDailyProduct(productIndex);
    };

    const handleDailyCardPointerDown = (event: PointerEvent<HTMLDivElement>) => {
        const target = event.target;
        if (target instanceof HTMLElement && target.closest('button')) return;

        dailyCardGestureRef.current = {
            hasDragged: false,
            startX: event.clientX,
            startY: event.clientY,
        };
    };

    const handleDailyCardPointerMove = (event: PointerEvent<HTMLDivElement>) => {
        const gesture = dailyCardGestureRef.current;
        const deltaX = Math.abs(event.clientX - gesture.startX);
        const deltaY = Math.abs(event.clientY - gesture.startY);

        if (deltaX > DAILY_CARD_TAP_THRESHOLD || deltaY > DAILY_CARD_TAP_THRESHOLD) {
            gesture.hasDragged = true;
        }
    };

    const handleDailyCardPointerCancel = () => {
        dailyCardGestureRef.current.hasDragged = true;
    };

    const handleDailyCardMediaClick = (event: MouseEvent<HTMLDivElement>, product: DailyProduct) => {
        const target = event.target;
        if (target instanceof HTMLElement && target.closest('button')) return;

        if (dailyCardGestureRef.current.hasDragged) {
            dailyCardGestureRef.current.hasDragged = false;
            return;
        }

        const rect = event.currentTarget.getBoundingClientRect();
        const direction = event.clientX - rect.left < rect.width / 2 ? -1 : 1;
        setDailyProductImage(product, direction);
    };

    return (
        <div className="roleta-vip-page">
            <main className="roleta-vip-shell" aria-busy={isLoading}>
                <section className="roleta-vip-top" aria-label="Resumo da roleta VIP">
                    <h1 className="roleta-vip-title">
                        <BrechoDaCamiLogo className="roleta-vip-logo" />
                    </h1>

                    {roleta.notificacoes.length > 0 && (
                        <div className="roleta-vip-notifications" aria-label="Notificacoes da roleta">
                            {roleta.notificacoes.map((notification, index) => (
                                <span
                                    className="roleta-vip-notification-chip"
                                    key={`${notification}-${index}`}
                                >
                                    <Heart size={8} fill="currentColor" strokeWidth={0} />
                                    {notification}
                                </span>
                            ))}
                        </div>
                    )}

                    <section className="roleta-vip-summary" aria-label="Resumo dos resgates">
                        <div className="roleta-vip-summary-half roleta-vip-summary-half--spins">
                            <strong>{formatTwoDigits(roleta.girosTotaisObtidos)}</strong>
                            <span>(giros totais obtidos)</span>
                        </div>
                        <div className="roleta-vip-summary-half roleta-vip-summary-half--money">
                            <strong>{formatCurrencyBRL(roleta.valorDisponivelResgate)}</strong>
                            <span>(resgate minimo de R$5,00)</span>
                        </div>
                    </section>

                    <section className="roleta-vip-group-goal" aria-label="Meta atual do grupo">
                        <div className="roleta-vip-group-goal-row">
                            <span>Meta atual do grupo</span>
                            <strong>{roleta.progressoGrupo}/{roleta.metaGrupo}</strong>
                        </div>
                        <div className="roleta-vip-group-progress" aria-hidden="true">
                            <span style={{ width: `${progressPercent}%` }} />
                        </div>
                        <p>
                            {roleta.metaGrupo} acoes -&gt; + {roleta.girosBonusGrupo} giros pra todos.
                        </p>
                    </section>

                    {error && (
                        <p className="roleta-vip-inline-error" role="alert">
                            {error}
                        </p>
                    )}

                    <div className="roleta-vip-switch" role="tablist" aria-label="Area da roleta">
                        <button
                            type="button"
                            className={activeTab === 'spin' ? 'is-active' : ''}
                            onClick={() => setActiveTab('spin')}
                        >
                            Girar a roleta
                        </button>
                        <button
                            type="button"
                            className={activeTab === 'daily' ? 'is-active' : ''}
                            onClick={() => setActiveTab('daily')}
                        >
                            Itens diarios
                        </button>
                    </div>

                    <div className="roleta-vip-tab-slot">
                        {activeTab === 'spin' && (
                            <section className="roleta-vip-wheel-section" aria-label="Girar a roleta">
                                <div className="roleta-vip-wheel-stage">
                                    <div className="roleta-vip-wheel-pointer" aria-hidden="true" />
                                    <div className="roleta-vip-wheel-frame">
                                        <div className="roleta-vip-wheel-inner-border">
                                            <motion.div
                                                className="roleta-vip-wheel-face"
                                                animate={{ rotate: wheelRotation }}
                                                transition={{ duration: 1.25, ease: [0.16, 1, 0.3, 1] }}
                                                style={{ background: wheelGradient }}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="roleta-vip-wheel-center-button"
                                            onClick={() => void handleSpin()}
                                            disabled={!canSpin}
                                        >
                                            {isSpinning ? 'girando' : 'girar'}
                                        </button>
                                    </div>
                                </div>

                                {!isLoading && !hasWheelOptions && (
                                    <p className="roleta-vip-no-spins">
                                        A roleta ainda nao tem niveis ativos configurados.
                                    </p>
                                )}

                                <p className="roleta-vip-spins-left">
                                    <strong>{roleta.girosDisponiveis}</strong> giro(s) restantes
                                </p>

                                <button
                                    type="button"
                                    className="roleta-vip-main-spin-button"
                                    onClick={() => void handleSpin()}
                                    disabled={!canSpin}
                                >
                                    {isSpinning ? 'Girando...' : 'Girar a roleta'}
                                </button>

                                {!isLoading && roleta.girosDisponiveis < 1 && (
                                    <p className="roleta-vip-no-spins">
                                        Voce ainda nao tem giros disponiveis.
                                    </p>
                                )}

                                {spinResult && (
                                    <section className="roleta-vip-result-card" aria-label="Resultado do giro">
                                        <span
                                            className="roleta-vip-result-level"
                                            style={{ background: spinResult.nivelCor }}
                                        >
                                            {spinResult.nivelNome}
                                        </span>
                                        <strong>{spinResult.premioTitulo}</strong>
                                        {spinResult.valorLabel && <span>{spinResult.valorLabel}</span>}
                                        {spinResult.premioDescricao && <p>{spinResult.premioDescricao}</p>}
                                    </section>
                                )}
                            </section>
                        )}

                        {activeTab === 'daily' && (
                            <section className="roleta-vip-daily-section" aria-label="Itens diarios">
                                {isDailyLoading && (
                                    <div className="roleta-vip-daily-state">Carregando itens diarios...</div>
                                )}

                                {!isDailyLoading && dailyError && (
                                    <div className="roleta-vip-daily-state" role="alert">
                                        <span>{dailyError}</span>
                                        <button type="button" onClick={() => void fetchDailyProducts()}>
                                            Tentar novamente
                                        </button>
                                    </div>
                                )}

                                {!isDailyLoading && !dailyError && dailyProducts.length === 0 && (
                                    <div className="roleta-vip-daily-state">Nenhum item diario disponivel.</div>
                                )}

                                {!isDailyLoading && !dailyError && dailyProducts.length > 0 && (
                                    <motion.div
                                        ref={dailyCarouselRef}
                                        className="roleta-vip-daily-carousel"
                                        aria-label={`Itens diarios, item ${activeProductIndex + 1} de ${dailyProducts.length}`}
                                        onScroll={handleDailyCarouselScroll}
                                    >
                                        {dailyProducts.map((product) => {
                                        const activeImageIndex = getClampedImageIndex(
                                            product,
                                            activeImageByProductId[product.id],
                                        );
                                        const mainImage = product.images[0];
                                        const isExpanded = expandedDailyProductId === product.id;
                                        const detailImageIndex = isExpanded && activeImageIndex === 0 && product.images.length > 1
                                            ? 1
                                            : activeImageIndex;
                                        const activeImage = product.images[getClampedImageIndex(product, detailImageIndex)];

                                        return (
                                            <motion.article
                                                    className="roleta-vip-daily-item"
                                                    key={product.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.22 }}
                                                >
                                                <div
                                                    className={`roleta-vip-daily-card${isExpanded ? ' is-expanded' : ''}`}
                                                    style={{ backgroundImage: `url("${mainImage}")` }}
                                                    onPointerDown={handleDailyCardPointerDown}
                                                    onPointerMove={handleDailyCardPointerMove}
                                                    onPointerCancel={handleDailyCardPointerCancel}
                                                    onClick={(event) => handleDailyCardMediaClick(event, product)}
                                                >
                                                        <div className="roleta-vip-daily-story-bars" aria-label="Fotos do item">
                                                            {product.images.map((image, imageIndex) => (
                                                                <button
                                                                    type="button"
                                                                    key={`${image}-${imageIndex}`}
                                                                    className={imageIndex === detailImageIndex ? 'is-active' : ''}
                                                                    onClick={() => selectDailyProductImage(product.id, imageIndex)}
                                                                    aria-label={`Ver foto ${imageIndex + 1}`}
                                                                />
                                                            ))}
                                                        </div>

                                                        {isExpanded ? (
                                                            <>
                                                                <span className="roleta-vip-daily-dark-overlay" aria-hidden="true" />
                                                                <img
                                                                    className="roleta-vip-daily-floating-image"
                                                                    src={activeImage}
                                                                    alt={product.nome}
                                                                    draggable={false}
                                                                />
                                                                {product.priceLabel && (
                                                                    <span className="roleta-vip-daily-price">
                                                                        {product.priceLabel}
                                                                    </span>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <img
                                                                className="roleta-vip-daily-cover-image"
                                                                src={activeImage}
                                                                alt={product.nome}
                                                                draggable={false}
                                                            />
                                                        )}

                                                        <button
                                                            type="button"
                                                            className="roleta-vip-daily-action"
                                                            onClick={() => setExpandedDailyProductId((currentProductId) => (
                                                                currentProductId === product.id ? null : product.id
                                                            ))}
                                                        >
                                                            {isExpanded ? 'Resgatar Item' : 'Ver item'}
                                                        </button>
                                                    </div>

                                            </motion.article>
                                        );
                                    })}
                                </motion.div>
                            )}

                            {!isDailyLoading && !dailyError && dailyProducts.length > 0 && (
                                <div className="roleta-vip-daily-footer">
                                    <div className={`roleta-vip-daily-product-info${expandedDailyProductId ? ' is-visible' : ''}`}>
                                        {(() => {
                                            const activeProduct = dailyProducts[activeProductIndex];
                                            const shouldShowInfo = Boolean(
                                                activeProduct && expandedDailyProductId === activeProduct.id,
                                            );

                                            return (
                                                <>
                                                    <strong>{shouldShowInfo ? activeProduct.nome : '\u00A0'}</strong>
                                                    <span>{shouldShowInfo ? `Tam. ${activeProduct.tamanho}.` : '\u00A0'}</span>
                                                </>
                                            );
                                        })()}
                                    </div>

                                    <div
                                        className="roleta-vip-daily-product-bars"
                                        aria-label="Produtos do carrossel"
                                        onPointerDown={handleDailyProductBarPointer}
                                        onPointerMove={handleDailyProductBarPointer}
                                        onPointerUp={handleDailyProductBarPointerEnd}
                                        onPointerCancel={handleDailyProductBarPointerEnd}
                                    >
                                        <span
                                            className="roleta-vip-daily-product-bar-thumb"
                                            style={{
                                                width: `${100 / Math.max(dailyProducts.length, 1)}%`,
                                                transform: `translateX(${dailyCarouselProgress * Math.max(dailyProducts.length - 1, 0) * 100}%)`,
                                            }}
                                        />
                                        {dailyProducts.map((dailyProduct, productIndex) => (
                                            <button
                                                type="button"
                                                key={dailyProduct.id}
                                                className={productIndex === activeProductIndex ? 'is-active' : ''}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    scrollToDailyProduct(productIndex);
                                                }}
                                                aria-label={`Ir para produto ${productIndex + 1}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
