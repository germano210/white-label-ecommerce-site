import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent, type UIEvent } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { BrechoDaCamiLogo } from '../components/common/BrechoDaCamiLogo';
import { AppIcon } from '../components/icons/AppIcon';
import { RoletaProfileModal } from '../components/roleta/RoletaProfileModal';
import { RoletaNotificationsStory } from '../components/roleta/RoletaNotificationsStory';
import { useAuthStore } from '../store/useAuthStore';
import { api, isCookieAuthMode } from '../utils/api';
import { apiRoutes } from '../utils/apiRoutes';
import { getImageUrl } from '../utils/imageUtils';
import { normalizeIndicationLink, type IndicacaoLinkApiLike } from '../utils/indicacaoReferral';
import {
    normalizeRoletaNotifications,
    sortRoletaNotificationsByNewest,
    type RoletaNotificacaoApi,
    type RoletaNotificationView,
} from '../utils/roletaNotifications';
import arrowImageIcon from '../assets/icons/arrowImage.svg';
import compartilhamentoIcon from '../assets/icons/compartilhamento.svg';
import './RoletaVipScreen.css';
import './roleta.css';

type NumericApiValue = number | string | null | undefined;
type RoletaTab = 'spin' | 'daily';
type RoletaTipoPremio = 'DESCONTO_VALOR' | 'DESCONTO_PERCENTUAL' | 'GIRO_EXTRA' | 'SEM_PREMIO';
type WheelRarityKey = 'COMUM' | 'INCOMUM' | 'MAGICO' | 'RARO' | 'LENDARIO';
type DailyProductStatus = 'DISPONIVEL' | 'RESERVADO' | 'VENDIDO';

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
    nivel?: number | string | RoletaPremioNivelApi | null;
    nivelId?: number | string | null;
    nivel_id?: number | string | null;
    nivelNome?: string | null;
    nivel_nome?: string | null;
    nivelCor?: string | null;
    nivel_cor?: string | null;
    nivelCorHex?: string | null;
    nivel_cor_hex?: string | null;
    corNivel?: string | null;
    cor_nivel?: string | null;
    corHex?: string | null;
    cor_hex?: string | null;
    cor?: string | null;
}

interface RoletaPremioNivelApi {
    id?: number | string | null;
    nome?: string | null;
    titulo?: string | null;
    corHex?: string | null;
    cor_hex?: string | null;
    cor?: string | null;
    ordem?: number | string | null;
    nivel?: number | string | null;
}

interface RoletaNivelApi {
    id?: number | string | null;
    nome?: string | null;
    titulo?: string | null;
    descricao?: string | null;
    corHex?: string | null;
    cor_hex?: string | null;
    cor?: string | null;
    ordem?: number | string | null;
    nivel?: number | string | null;
    ativo?: boolean | number | string | null;
    ativa?: boolean | number | string | null;
    premios?: RoletaPremioApi[] | null;
}

interface RoletaMetaApi {
    id?: number | string | null;
    titulo?: string | null;
    descricao?: string | null;
    quantidadeAlvo?: NumericApiValue;
    quantidade_alvo?: NumericApiValue;
    progressoAtual?: NumericApiValue;
    progresso_atual?: NumericApiValue;
    girosRecompensa?: NumericApiValue;
    giros_recompensa?: NumericApiValue;
    ordem?: NumericApiValue;
    ativa?: boolean | number | string | null;
    ativo?: boolean | number | string | null;
    status?: string | null;
    criadaEm?: string | null;
    criada_em?: string | null;
    atualizadaEm?: string | null;
    atualizada_em?: string | null;
    iniciadaEm?: string | null;
    iniciada_em?: string | null;
    concluidaEm?: string | null;
    concluida_em?: string | null;
}

interface RoletaStatusApi {
    ativa?: boolean | null;
    titulo?: string | null;
    urlConvite?: string | null;
    url_convite?: string | null;
    conviteUrl?: string | null;
    convite_url?: string | null;
    linkConvite?: string | null;
    link_convite?: string | null;
    premioAtual?: RoletaPremioApi | null;
    premio_atual?: RoletaPremioApi | null;
    premioPendente?: RoletaPremioApi | null;
    premio_pendente?: RoletaPremioApi | null;
    premioVigente?: RoletaPremioApi | null;
    premio_vigente?: RoletaPremioApi | null;
    descontoAtual?: RoletaPremioApi | null;
    desconto_atual?: RoletaPremioApi | null;
    girosTotaisObtidos?: NumericApiValue;
    giros_totais_obtidos?: NumericApiValue;
    girosDisponiveis?: NumericApiValue;
    giros_disponiveis?: NumericApiValue;
    valorDisponivelResgate?: NumericApiValue;
    valor_disponivel_resgate?: NumericApiValue;
    metaAtual?: RoletaMetaApi | null;
    meta_atual?: RoletaMetaApi | null;
    metaGrupo?: NumericApiValue;
    meta_grupo?: NumericApiValue;
    progressoGrupo?: NumericApiValue;
    progresso_grupo?: NumericApiValue;
    girosBonusGrupo?: NumericApiValue;
    giros_bonus_grupo?: NumericApiValue;
    notificacoes?: RoletaNotificacaoApi[] | null;
    ultimosEventos?: RoletaNotificacaoApi[] | null;
    niveis?: RoletaNivelApi[] | null;
    niveisRoleta?: RoletaNivelApi[] | null;
    niveis_roleta?: RoletaNivelApi[] | null;
}

interface RoletaGiroResponse extends Partial<RoletaStatusApi> {
    premioAtual?: RoletaPremioApi | null;
    premio_atual?: RoletaPremioApi | null;
    premioPendente?: RoletaPremioApi | null;
    premio_pendente?: RoletaPremioApi | null;
    premio?: RoletaPremioApi | null;
    premioSorteado?: RoletaPremioApi | null;
    premio_sorteado?: RoletaPremioApi | null;
    girosDisponiveis?: NumericApiValue;
    giros_disponiveis?: NumericApiValue;
    roleta?: RoletaStatusApi | null;
}

interface ProdutoCheckoutResponse {
    checkoutUrl?: string;
    gatewayUrl?: string;
    url?: string;
    status?: string | null;
    reservado?: boolean | number | string | null;
    reservadoPorMim?: boolean | number | string | null;
    reservado_por_mim?: boolean | number | string | null;
    reservadoAte?: string | null;
    reservado_ate?: string | null;
    vendido?: boolean | number | string | null;
    produto?: RoletaProdutoApi | null;
    product?: RoletaProdutoApi | null;
    item?: RoletaProdutoApi | null;
}

interface RoletaWheelSlice {
    id: string;
    sourceLevelId: string;
    label: string;
    color: string;
    levelColor: string;
    order: number;
    level: number;
    rarity: WheelRarityKey;
}

interface RoletaSpinResult {
    nivelNome: string;
    nivelCor: string;
    premioTitulo: string;
    premioDescricao: string;
    tipoPremio: string;
    valor: number;
    valorLabel: string;
}

interface RoletaMetaView {
    id: string;
    titulo: string;
    descricao: string;
    quantidadeAlvo: number;
    progressoAtual: number;
    girosRecompensa: number;
    ordem: number;
    ativa: boolean;
    status: string;
    criadaEm: string;
    atualizadaEm: string;
    iniciadaEm: string;
    concluidaEm: string;
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
    status?: string | null;
    reservado?: boolean | number | string | null;
    reservadoPorMim?: boolean | number | string | null;
    reservado_por_mim?: boolean | number | string | null;
    reservadoAte?: string | null;
    reservado_ate?: string | null;
    vendido?: boolean | number | string | null;
    checkoutUrl?: string | null;
    checkout_url?: string | null;
    gatewayUrl?: string | null;
    gateway_url?: string | null;
    url?: string | null;
}

interface RoletaProdutosResponse {
    content?: RoletaProdutoApi[];
    produtos?: RoletaProdutoApi[];
    items?: RoletaProdutoApi[];
    data?: RoletaProdutoApi[];
}

interface DailyProduct {
    id: string;
    clientKey: string;
    nome: string;
    tamanho: string;
    priceValue: number;
    priceLabel: string;
    images: string[];
    status: DailyProductStatus;
    reservadoPorMim: boolean;
    reservadoAte: string;
    checkoutUrl: string;
}

interface RoletaViewState {
    ativa: boolean;
    urlConvite: string;
    girosTotaisObtidos: number;
    girosDisponiveis: number;
    valorDisponivelResgate: number;
    hasMeta: boolean;
    metaAtual: RoletaMetaView | null;
    metaGrupo: number;
    progressoGrupo: number;
    girosBonusGrupo: number;
    notificacoes: RoletaNotificationView[];
    opcoes: RoletaWheelSlice[];
    premioAtual: RoletaSpinResult | null;
}

const emptyRoletaState: RoletaViewState = {
    ativa: false,
    urlConvite: '',
    girosTotaisObtidos: 0,
    girosDisponiveis: 0,
    valorDisponivelResgate: 0,
    hasMeta: false,
    metaAtual: null,
    metaGrupo: 0,
    progressoGrupo: 0,
    girosBonusGrupo: 0,
    notificacoes: [],
    opcoes: [],
    premioAtual: null,
};

const rarityPresets = [
    { nome: 'Grau Militar', corHex: '#2563EB' },
    { nome: 'Restrito', corHex: '#7C3AED' },
    { nome: 'Classificado', corHex: '#E83E8C' },
    { nome: 'Encoberto / Secreto', corHex: '#DC2626' },
    { nome: 'Extremamente Raro / Ouro', corHex: '#D4A017' },
];

const wheelRarityOrder: WheelRarityKey[] = ['COMUM', 'INCOMUM', 'MAGICO', 'RARO', 'LENDARIO'];
const wheelRaritySlots: WheelRarityKey[] = [
    'COMUM',
    'INCOMUM',
    'COMUM',
    'MAGICO',
    'COMUM',
    'RARO',
    'INCOMUM',
    'COMUM',
    'MAGICO',
    'COMUM',
    'INCOMUM',
    'LENDARIO',
];

const DAILY_CARD_TAP_THRESHOLD = 10;
const WHEEL_FULL_TURNS = 7;
const WHEEL_SPIN_DURATION_MS = 3800;
const DAILY_TAB_QUERY_VALUE = 'itens';
const LOCAL_ROULETTE_NOTIFICATIONS_KEY = 'roleta-vip-local-notifications';
const LOCAL_ROULETTE_NOTIFICATION_TTL_MS = 30 * 60 * 1000;

function getInitialRoletaTabFromUrl(): RoletaTab {
    if (typeof window === 'undefined') return 'spin';

    return new URLSearchParams(window.location.search).get('aba') === DAILY_TAB_QUERY_VALUE
        ? 'daily'
        : 'spin';
}

function getInitialSharedProductIdFromUrl() {
    if (typeof window === 'undefined') return '';

    return new URLSearchParams(window.location.search).get('produto')?.trim() ?? '';
}

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

// function formatTwoDigits(value: number) {
//     return Math.max(0, Math.floor(value)).toString().padStart(2, '0');
// }

function formatCurrencyBRL(value: number) {
    return value
        .toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        })
        .replace(/\s/g, '');
}

function renderPriceLabel(label: string) {
    const match = label.match(/^(R\$)(.*)$/);

    if (!match) return label;

    return (
        <>
            <span className="roleta-vip-price-currency">{match[1]}</span>
            {match[2]}
        </>
    );
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

function hasApiValue(value: NumericApiValue) {
    return value !== null && value !== undefined && value !== '';
}

function normalizeRoletaMeta(meta?: RoletaMetaApi | null): RoletaMetaView | null {
    if (!meta) return null;

    const quantidadeAlvo = Math.max(0, Math.floor(parseApiNumber(
        meta.quantidadeAlvo ?? meta.quantidade_alvo,
    )));

    if (quantidadeAlvo <= 0) return null;

    const progressoAtual = Math.min(
        Math.max(0, Math.floor(parseApiNumber(meta.progressoAtual ?? meta.progresso_atual))),
        quantidadeAlvo,
    );

    return {
        id: String(meta.id ?? ''),
        titulo: meta.titulo?.trim() || 'Meta atual do grupo',
        descricao: meta.descricao?.trim() ?? '',
        quantidadeAlvo,
        progressoAtual,
        girosRecompensa: Math.max(0, Math.floor(parseApiNumber(
            meta.girosRecompensa ?? meta.giros_recompensa,
        ))),
        ordem: Math.max(0, Math.floor(parseApiNumber(meta.ordem))),
        ativa: toBoolean(meta.ativa ?? meta.ativo, true),
        status: meta.status?.trim() ?? '',
        criadaEm: meta.criadaEm ?? meta.criada_em ?? '',
        atualizadaEm: meta.atualizadaEm ?? meta.atualizada_em ?? '',
        iniciadaEm: meta.iniciadaEm ?? meta.iniciada_em ?? '',
        concluidaEm: meta.concluidaEm ?? meta.concluida_em ?? '',
    };
}

function normalizeHexColor(value: string | null | undefined, fallback: string) {
    const normalizedValue = value?.trim().replace(/^#/, '').replace(/^0x/i, '');

    if (normalizedValue && /^[0-9a-fA-F]{3}$/.test(normalizedValue)) {
        return `#${normalizedValue.split('').map((char) => `${char}${char}`).join('').toUpperCase()}`;
    }

    if (normalizedValue && /^[0-9a-fA-F]{6}$/.test(normalizedValue)) {
        return `#${normalizedValue.toUpperCase()}`;
    }

    return fallback;
}

function pickHexColor(values: Array<string | null | undefined>, fallback: string) {
    for (const value of values) {
        const normalizedValue = normalizeHexColor(value, '');
        if (normalizedValue) return normalizedValue;
    }

    return fallback;
}

function isPrizeLevelObject(value: RoletaPremioApi['nivel']): value is RoletaPremioNivelApi {
    return Boolean(value && typeof value === 'object');
}

function normalizeWheelLevelName(value: string) {
    const normalizedValue = value.trim().toUpperCase();
    return normalizedValue === 'NICO' ? 'UNICO' : normalizedValue;
}

function normalizeRarityText(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toUpperCase();
}

function getWheelRarityKey(level: RoletaNivelApi, fallbackIndex: number): WheelRarityKey {
    const normalizedName = normalizeRarityText(level.nome ?? level.titulo ?? '');

    if (
        normalizedName.includes('LENDARIO')
        || normalizedName.includes('LEGENDARIO')
        || normalizedName.includes('EXTREMAMENTE')
        || normalizedName.includes('OURO')
        || normalizedName.includes('EPICO')
    ) {
        return 'LENDARIO';
    }

    if (normalizedName.includes('RARO')) return 'RARO';
    if (normalizedName.includes('MAGICO') || normalizedName.includes('MAGICA')) return 'MAGICO';
    if (normalizedName.includes('INCOMUM') || normalizedName.includes('RESTRITO')) return 'INCOMUM';
    if (normalizedName.includes('COMUM') || normalizedName.includes('GRAU MILITAR')) return 'COMUM';

    return wheelRarityOrder[Math.min(fallbackIndex, wheelRarityOrder.length - 1)];
}

function shouldUseDarkTextForPrizeLevel(prize?: RoletaSpinResult | null) {
    const normalizedName = normalizeRarityText(prize?.nivelNome ?? '');

    return (
        normalizedName.includes('COMUM')
        || normalizedName.includes('GRAU MILITAR')
        || normalizedName.includes('INCOMUM')
        || normalizedName.includes('RESTRITO')
    );
}

function readLocalRouletteNotifications() {
    if (typeof window === 'undefined') return [];

    try {
        const rawNotifications = window.sessionStorage.getItem(LOCAL_ROULETTE_NOTIFICATIONS_KEY);
        if (!rawNotifications) return [];

        const parsedNotifications = JSON.parse(rawNotifications);
        if (!Array.isArray(parsedNotifications)) return [];

        const now = Date.now();
        const notifications = parsedNotifications.filter((notification): notification is RoletaNotificationView => (
            notification
            && typeof notification === 'object'
            && typeof notification.id === 'string'
            && typeof notification.texto === 'string'
            && typeof notification.createdAtMs === 'number'
            && now - notification.createdAtMs <= LOCAL_ROULETTE_NOTIFICATION_TTL_MS
        ));

        window.sessionStorage.setItem(
            LOCAL_ROULETTE_NOTIFICATIONS_KEY,
            JSON.stringify(notifications),
        );

        return notifications;
    } catch {
        return [];
    }
}

function saveLocalRouletteNotifications(notifications: RoletaNotificationView[]) {
    if (typeof window === 'undefined') return;

    try {
        window.sessionStorage.setItem(
            LOCAL_ROULETTE_NOTIFICATIONS_KEY,
            JSON.stringify(sortRoletaNotificationsByNewest(notifications).slice(0, 12)),
        );
    } catch {
        // sessionStorage can be unavailable in restrictive browsers; the in-memory update still works.
    }
}

function pushLocalRouletteNotification(notification: RoletaNotificationView) {
    const currentNotifications = readLocalRouletteNotifications();
    const nextNotifications = [
        notification,
        ...currentNotifications.filter((currentNotification) => currentNotification.id !== notification.id),
    ];

    saveLocalRouletteNotifications(nextNotifications);
}

function mergeLocalNotificationsIntoRoleta(roletaState: RoletaViewState): RoletaViewState {
    const serverNotificationTexts = new Set(
        roletaState.notificacoes.map((notification) => notification.texto.trim().toLocaleLowerCase('pt-BR')),
    );
    const localNotifications = readLocalRouletteNotifications().filter((notification) => (
        !serverNotificationTexts.has(notification.texto.trim().toLocaleLowerCase('pt-BR'))
    ));

    if (localNotifications.length === 0) return roletaState;

    return {
        ...roletaState,
        notificacoes: sortRoletaNotificationsByNewest([
            ...localNotifications,
            ...roletaState.notificacoes,
        ]),
    };
}

function createLocalPrizeUseNotification(product: DailyProduct): RoletaNotificationView {
    const now = new Date();
    const createdAtMs = now.getTime();

    return {
        id: `local-usar-premio-${product.id}-${createdAtMs}`,
        tipo: 'USAR_PREMIO',
        texto: `Um membro resgatou a ${product.nome}`,
        nivelNome: '',
        nivelCorHex: '',
        criadoEm: now.toISOString(),
        createdAtMs,
        sourceIndex: -1,
    };
}

function normalizeWheelSlicesFromLevels(levels: RoletaNivelApi[]) {
    const activeLevels = levels
        .filter((level) => toBoolean(level.ativo ?? level.ativa, true))
        .map((level, index) => {
            const preset = rarityPresets[index % rarityPresets.length];
            const order = Math.max(1, Math.floor(parseApiNumber(level.ordem ?? level.nivel ?? index + 1)));
            const label = normalizeWheelLevelName((level.nome ?? level.titulo ?? preset.nome).trim());
            const levelColor = pickHexColor([level.corHex, level.cor_hex, level.cor], preset.corHex);
            const levelId = String(level.id ?? `nivel-${order}`);
            const rarity = getWheelRarityKey(level, index);

            return {
                id: levelId,
                sourceLevelId: levelId,
                label,
                color: levelColor,
                levelColor,
                order,
                level: Math.max(1, Math.floor(parseApiNumber(level.nivel ?? order))),
                rarity,
            };
        })
        .sort((a, b) => a.order - b.order);

    if (activeLevels.length === 0) return [];

    const levelsByRarity = new Map<WheelRarityKey, RoletaWheelSlice>();
    activeLevels.forEach((level) => {
        if (!levelsByRarity.has(level.rarity)) {
            levelsByRarity.set(level.rarity, level);
        }
    });

    return wheelRaritySlots.map((rarity, slotIndex) => {
        const fallbackLevelIndex = Math.min(wheelRarityOrder.indexOf(rarity), activeLevels.length - 1);
        const level = levelsByRarity.get(rarity) ?? activeLevels[fallbackLevelIndex] ?? activeLevels[0];

        return {
            ...level,
            id: `${level.sourceLevelId}-slot-${slotIndex + 1}`,
            order: slotIndex + 1,
            rarity,
        };
    });
}

function normalizeWheelSlices(data?: RoletaStatusApi | null) {
    const rawLevels = data?.niveis ?? data?.niveisRoleta ?? data?.niveis_roleta ?? [];
    return normalizeWheelSlicesFromLevels(rawLevels);
}

function normalizeInviteUrl(data?: RoletaStatusApi | IndicacaoLinkApiLike | null) {
    return normalizeIndicationLink(data);
}

function getPremioAtualFromStatus(data?: RoletaStatusApi | null) {
    return data?.premioAtual
        ?? data?.premio_atual
        ?? data?.premioPendente
        ?? data?.premio_pendente
        ?? data?.premioVigente
        ?? data?.premio_vigente
        ?? data?.descontoAtual
        ?? data?.desconto_atual
        ?? null;
}

function getPremioAtualFromSpin(data?: RoletaGiroResponse | null) {
    return data?.premioAtual
        ?? data?.premio_atual
        ?? data?.premioPendente
        ?? data?.premio_pendente
        ?? data?.premioSorteado
        ?? data?.premio_sorteado
        ?? data?.premio
        ?? null;
}

function getPremioTipo(prize?: RoletaPremioApi | null) {
    return (prize?.tipoPremio ?? prize?.tipo_premio ?? '').trim().toUpperCase();
}

function normalizeRoletaStatus(data?: RoletaStatusApi | null): RoletaViewState {
    const metaAtual = normalizeRoletaMeta(data?.metaAtual ?? data?.meta_atual);
    const rawMetaGrupo = data?.metaGrupo ?? data?.meta_grupo;
    const parsedLegacyMetaGrupo = Math.floor(parseApiNumber(rawMetaGrupo));
    const hasLegacyMeta = !metaAtual && hasApiValue(rawMetaGrupo) && parsedLegacyMetaGrupo > 0;
    const legacyMetaGrupo = Math.max(1, parsedLegacyMetaGrupo);
    const metaGrupo = metaAtual?.quantidadeAlvo ?? (hasLegacyMeta ? legacyMetaGrupo : 0);
    const progressoGrupo = metaAtual?.progressoAtual ?? (
        hasLegacyMeta
            ? Math.min(
                Math.max(0, Math.floor(parseApiNumber(data?.progressoGrupo ?? data?.progresso_grupo))),
                metaGrupo,
            )
            : 0
    );
    const girosBonusGrupo = metaAtual?.girosRecompensa ?? (
        hasLegacyMeta
            ? Math.max(0, Math.floor(parseApiNumber(data?.girosBonusGrupo ?? data?.giros_bonus_grupo)))
            : 0
    );
    const rawNotifications = data?.notificacoes ?? data?.ultimosEventos ?? [];
    const opcoes = normalizeWheelSlices(data);

    return {
        ativa: data?.ativa ?? true,
        urlConvite: normalizeInviteUrl(data),
        girosTotaisObtidos: Math.max(0, parseApiNumber(
            data?.girosTotaisObtidos ?? data?.giros_totais_obtidos,
        )),
        girosDisponiveis: Math.max(0, Math.floor(parseApiNumber(
            data?.girosDisponiveis ?? data?.giros_disponiveis,
        ))),
        valorDisponivelResgate: Math.max(0, parseApiNumber(
            data?.valorDisponivelResgate ?? data?.valor_disponivel_resgate,
        )),
        hasMeta: Boolean(metaAtual) || hasLegacyMeta,
        metaAtual,
        metaGrupo,
        progressoGrupo,
        girosBonusGrupo,
        notificacoes: normalizeRoletaNotifications(rawNotifications),
        opcoes,
        premioAtual: createPrizeView(getPremioAtualFromStatus(data), opcoes),
    };
}

function hasMetaPayloadFields(data?: RoletaGiroResponse | RoletaStatusApi | null) {
    return Boolean(data && (
        data.metaAtual !== undefined
        || data.meta_atual !== undefined
        || data.metaGrupo !== undefined
        || data.meta_grupo !== undefined
        || data.progressoGrupo !== undefined
        || data.progresso_grupo !== undefined
        || data.girosBonusGrupo !== undefined
        || data.giros_bonus_grupo !== undefined
    ));
}

function hasRoletaStatusPayload(data?: RoletaGiroResponse | null) {
    return Boolean(data && (
        hasMetaPayloadFields(data)
        || data.niveis !== undefined
        || data.niveisRoleta !== undefined
        || data.niveis_roleta !== undefined
    ));
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

function getRoletaCheckoutErrorMessage(error: unknown) {
    if (!axios.isAxiosError(error)) {
        return 'Nao foi possivel iniciar o resgate agora. Tente novamente.';
    }

    const responseData = error.response?.data as {
        message?: string;
        error?: string;
    } | undefined;

    return responseData?.message ?? responseData?.error ?? 'Nao foi possivel iniciar o resgate agora. Tente novamente.';
}

function isCheckoutInProgressError(error: unknown) {
    if (!axios.isAxiosError(error)) return false;

    const responseData = error.response?.data as {
        message?: string;
        error?: string;
    } | string | undefined;
    const responseText = typeof responseData === 'string'
        ? responseData
        : `${responseData?.message ?? ''} ${responseData?.error ?? ''}`;
    const normalizedText = responseText
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    return error.response?.status === 409 && (
        normalizedText.includes('checkout')
        || normalizedText.includes('pagamento')
        || normalizedText.includes('andamento')
    );
}

function createWheelGradient(slices: RoletaWheelSlice[]) {
    if (slices.length === 0) return '#E6D9D4';

    const sliceCount = Math.max(slices.length, 1);
    const sliceAngle = 360 / sliceCount;
    const segments = slices.map((slice, index) => {
        const start = index * sliceAngle;
        const end = (index + 1) * sliceAngle;
        return `${slice.color} ${start}deg ${end}deg`;
    });

    return `conic-gradient(from ${-sliceAngle / 2}deg, ${segments.join(', ')})`;
}

function normalizeDegrees(value: number) {
    return ((value % 360) + 360) % 360;
}

function getMatchedPrizeSlice(premio: RoletaPremioApi | null | undefined, slices: RoletaWheelSlice[]) {
    if (!premio || slices.length === 0) return null;

    const rawPrizeLevel = premio.nivel;
    const prizeLevel = isPrizeLevelObject(rawPrizeLevel) ? rawPrizeLevel : null;
    const flatLevelValue: NumericApiValue = isPrizeLevelObject(rawPrizeLevel) ? null : rawPrizeLevel;
    const levelId = prizeLevel?.id ?? premio.nivelId ?? premio.nivel_id ?? flatLevelValue;
    const levelNumber = Math.max(1, Math.floor(parseApiNumber(
        prizeLevel?.nivel
        ?? prizeLevel?.ordem
        ?? premio?.nivelId
        ?? premio?.nivel_id
        ?? flatLevelValue
        ?? 1,
    )));
    const levelNameFromPrize = (
        premio?.nivelNome
        ?? premio?.nivel_nome
        ?? prizeLevel?.nome
        ?? prizeLevel?.titulo
        ?? ''
    ).trim();

    return slices.find((slice) => prizeLevel?.id && slice.sourceLevelId === String(prizeLevel.id))
        ?? slices.find((slice) => levelId !== null && levelId !== undefined && slice.sourceLevelId === String(levelId))
        ?? slices.find((slice) => prizeLevel?.id && slice.id === String(prizeLevel.id))
        ?? slices.find((slice) => levelId !== null && levelId !== undefined && slice.id === String(levelId))
        ?? slices.find((slice) => slice.level === levelNumber || slice.order === levelNumber)
        ?? slices.find((slice) => levelNameFromPrize && slice.label === normalizeWheelLevelName(levelNameFromPrize))
        ?? null;
}

function getPrizeSliceIndex(premio: RoletaPremioApi | null | undefined, slices: RoletaWheelSlice[]) {
    const matchedSlice = getMatchedPrizeSlice(premio, slices);
    if (!matchedSlice) return Math.floor(Math.random() * Math.max(slices.length, 1));

    const matchingSliceIndexes = slices
        .map((slice, index) => ({ slice, index }))
        .filter(({ slice }) => slice.sourceLevelId === matchedSlice.sourceLevelId)
        .map(({ index }) => index);

    if (matchingSliceIndexes.length === 0) {
        return Math.max(0, slices.findIndex((slice) => slice.id === matchedSlice.id));
    }

    return matchingSliceIndexes[Math.floor(Math.random() * matchingSliceIndexes.length)];
}

function getRandomSliceOffsetDegrees(totalSlices: number) {
    if (totalSlices <= 0) return 0;

    const sliceAngle = 360 / totalSlices;
    const safeOffsetRange = sliceAngle * 0.64;

    return (Math.random() - 0.5) * safeOffsetRange;
}

function createTargetWheelRotation(
    currentRotation: number,
    targetSliceIndex: number,
    totalSlices: number,
    targetSliceOffsetDegrees: number,
) {
    if (totalSlices <= 0) return currentRotation + (WHEEL_FULL_TURNS * 360);

    const sliceAngle = 360 / totalSlices;
    const targetRotation = normalizeDegrees(-((targetSliceIndex * sliceAngle) + targetSliceOffsetDegrees));
    const currentRotationPosition = normalizeDegrees(currentRotation);
    const remainingRotation = normalizeDegrees(targetRotation - currentRotationPosition);

    return currentRotation + (WHEEL_FULL_TURNS * 360) + remainingRotation;
}

function waitForAnimation(durationMs: number) {
    return new Promise((resolve) => {
        window.setTimeout(resolve, durationMs);
    });
}

function isRoletaParticipantConflictError(error: unknown) {
    if (!axios.isAxiosError(error)) return false;

    const responseText = typeof error.response?.data === 'string'
        ? error.response.data
        : JSON.stringify(error.response?.data ?? {});

    return error.response?.status === 500 && (
        responseText.includes('uk_roleta_participante_usuario')
        || responseText.includes('roleta_participantes')
        || responseText.toLowerCase().includes('duplicate key')
    );
}

async function runWithRoletaParticipantRetry<T>(request: () => Promise<T>) {
    try {
        return await request();
    } catch (error) {
        if (!isRoletaParticipantConflictError(error)) throw error;

        await waitForAnimation(450);
        return request();
    }
}

function removePrizeNegativeSign(label: string) {
    return label
        .trim()
        .replace(/^-\s*(R\$)/, '$1')
        .replace(/^(R\$)\s*-\s*/, '$1');
}

function getPrizeValueLabel(prize?: RoletaPremioApi | null) {
    if (!prize) return '';
    if (prize.valorFormatado) return removePrizeNegativeSign(prize.valorFormatado);
    if (prize.valor_formatado) return removePrizeNegativeSign(prize.valor_formatado);

    const prizeValue = Math.abs(parseApiNumber(
        prize.valor
        ?? prize.valorPremio
        ?? prize.valor_premio
        ?? prize.valorMaximo
        ?? prize.valor_maximo
        ?? prize.valorMinimo
        ?? prize.valor_minimo,
    ));

    const tipoPremio = prize.tipoPremio ?? prize.tipo_premio;
    if (tipoPremio === 'DESCONTO_PERCENTUAL' && prizeValue > 0) return `${prizeValue}%`;
    if (tipoPremio === 'GIRO_EXTRA') {
        const spins = parseApiNumber(prize.girosExtras ?? prize.giros_extras ?? prizeValue);
        return spins > 0 ? `${spins} giro(s)` : '';
    }
    if (prizeValue > 0) return formatCurrencyBRL(prizeValue);

    return '';
}

function getPrizeNumericValue(prize?: RoletaPremioApi | null) {
    return Math.abs(parseApiNumber(
        prize?.valor
        ?? prize?.valorPremio
        ?? prize?.valor_premio
        ?? prize?.valorMaximo
        ?? prize?.valor_maximo
        ?? prize?.valorMinimo
        ?? prize?.valor_minimo,
    ));
}

function createPrizeView(
    premio: RoletaPremioApi | null | undefined,
    slices: RoletaWheelSlice[],
): RoletaSpinResult | null {
    if (!premio) return null;

    const rawPrizeLevel = premio.nivel;
    const prizeLevel = isPrizeLevelObject(rawPrizeLevel) ? rawPrizeLevel : null;
    const flatLevelValue: NumericApiValue = isPrizeLevelObject(rawPrizeLevel) ? null : rawPrizeLevel;
    const levelId = prizeLevel?.id ?? premio.nivelId ?? premio.nivel_id ?? flatLevelValue;
    const levelNumber = Math.max(1, Math.floor(parseApiNumber(
        prizeLevel?.nivel
        ?? prizeLevel?.ordem
        ?? premio?.nivelId
        ?? premio?.nivel_id
        ?? flatLevelValue
        ?? 1,
    )));
    const levelNameFromPrize = (
        premio?.nivelNome
        ?? premio?.nivel_nome
        ?? prizeLevel?.nome
        ?? prizeLevel?.titulo
        ?? ''
    ).trim();
    const matchedSlice = slices.find((slice) => prizeLevel?.id && slice.sourceLevelId === String(prizeLevel.id))
        ?? slices.find((slice) => levelId !== null && levelId !== undefined && slice.sourceLevelId === String(levelId))
        ?? slices.find((slice) => prizeLevel?.id && slice.id === String(prizeLevel.id))
        ?? slices.find((slice) => levelId !== null && levelId !== undefined && slice.id === String(levelId))
        ?? slices.find((slice) => slice.level === levelNumber || slice.order === levelNumber)
        ?? slices.find((slice) => levelNameFromPrize && slice.label === normalizeWheelLevelName(levelNameFromPrize))
        ?? slices[0];
    const preset = rarityPresets[(levelNumber - 1) % rarityPresets.length];
    const nivelNome = (
        levelNameFromPrize
        || matchedSlice?.label
        || preset.nome
    ).trim();
    const premioTitulo = (
        premio?.titulo
        ?? 'Premio sorteado'
    ).trim();
    const premioDescricao = (
        premio?.descricao
        ?? ''
    ).trim();
    const tipoPremio = getPremioTipo(premio);
    const valorLabel = getPrizeValueLabel(premio);

    if (!premioTitulo && !nivelNome) return null;

    return {
        nivelNome: nivelNome || 'Nivel sorteado',
        nivelCor: pickHexColor(
            [
                premio?.corHex,
                premio?.cor_hex,
                premio?.nivelCorHex,
                premio?.nivel_cor_hex,
                premio?.nivelCor,
                premio?.nivel_cor,
                premio?.corNivel,
                premio?.cor_nivel,
                premio?.cor,
                prizeLevel?.corHex,
                prizeLevel?.cor_hex,
                prizeLevel?.cor,
                matchedSlice?.levelColor,
            ],
            preset.corHex,
        ),
        premioTitulo: premioTitulo || 'Premio sorteado',
        premioDescricao,
        tipoPremio,
        valor: getPrizeNumericValue(premio),
        valorLabel,
    };
}

function getDiscountedPricePreview(product: DailyProduct, premioAtual: RoletaSpinResult | null) {
    if (!premioAtual || product.priceValue <= 0 || premioAtual.valor <= 0) return null;

    let discountValue = 0;

    if (premioAtual.tipoPremio === 'DESCONTO_PERCENTUAL') {
        discountValue = product.priceValue * Math.min(Math.max(premioAtual.valor, 0), 100) / 100;
    }

    if (premioAtual.tipoPremio === 'DESCONTO_VALOR') {
        discountValue = Math.min(Math.max(premioAtual.valor, 0), product.priceValue);
    }

    if (discountValue <= 0) return null;

    const discountedPrice = Math.max(product.priceValue - discountValue, 0);
    if (discountedPrice >= product.priceValue) return null;

    return {
        originalLabel: product.priceLabel,
        discountedLabel: formatCurrencyBRL(discountedPrice),
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

function normalizeApiStatus(value: string | null | undefined) {
    return (value ?? '')
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase();
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

function normalizeDailyProductStatus(product: RoletaProdutoApi): DailyProductStatus {
    const rawStatus = normalizeApiStatus(product.status);
    const isSold = rawStatus === 'VENDIDO' || toBoolean(product.vendido, false);
    const isReserved = rawStatus === 'RESERVADO' || toBoolean(product.reservado, false);

    if (isSold) return 'VENDIDO';
    if (isReserved) return 'RESERVADO';

    return 'DISPONIVEL';
}

function normalizeDailyProductCheckoutUrl(product: RoletaProdutoApi) {
    return (
        product.checkoutUrl
        ?? product.checkout_url
        ?? product.gatewayUrl
        ?? product.gateway_url
        ?? product.url
        ?? ''
    ).trim();
}

function normalizeDailyProduct(
    product: RoletaProdutoApi,
    index: number,
    currentProduct?: DailyProduct,
): DailyProduct {
    const id = String(
        product.id
        ?? product.produtoId
        ?? product.produto_id
        ?? currentProduct?.id
        ?? `daily-${index}`,
    );
    const priceValue = parseApiNumber(
        product.precoVenda
        ?? product.preco_venda
        ?? product.preco
        ?? product.valor
        ?? currentProduct?.priceValue,
    );

    return {
        id,
        clientKey: currentProduct?.clientKey ?? `${id || 'daily'}-${index}`,
        nome: (product.nome ?? product.titulo ?? currentProduct?.nome ?? 'Item diario').trim(),
        tamanho: (product.tamanho ?? currentProduct?.tamanho ?? 'Unico').trim(),
        priceValue,
        priceLabel: priceValue > 0 ? formatCurrencyBRL(priceValue) : currentProduct?.priceLabel ?? '',
        images: (product.imagens?.length || product.fotos?.length || product.imagemUrl || product.imagem_url)
            ? normalizeDailyProductImages(product)
            : currentProduct?.images ?? normalizeDailyProductImages(product),
        status: normalizeDailyProductStatus(product),
        reservadoPorMim: toBoolean(product.reservadoPorMim ?? product.reservado_por_mim, false),
        reservadoAte: (product.reservadoAte ?? product.reservado_ate ?? '').trim(),
        checkoutUrl: normalizeDailyProductCheckoutUrl(product),
    };
}

function normalizeDailyProductsResponse(data: RoletaProdutoApi[] | RoletaProdutosResponse) {
    const rawProducts = Array.isArray(data)
        ? data
        : data.content ?? data.produtos ?? data.items ?? data.data ?? [];

    return rawProducts
        .map((product, index) => normalizeDailyProduct(product, index))
        .filter((product) => product.id.trim());
}

function getCheckoutUrlFromResponse(data: ProdutoCheckoutResponse) {
    return data.checkoutUrl ?? data.gatewayUrl ?? data.url ?? '';
}

function getDailyProductFromCheckoutResponse(
    data: ProdutoCheckoutResponse,
    fallbackProdutoId: string,
): RoletaProdutoApi | null {
    if (data.produto) return data.produto;
    if (data.product) return data.product;
    if (data.item) return data.item;

    if (
        data.status !== undefined
        || data.reservado !== undefined
        || data.reservadoPorMim !== undefined
        || data.reservado_por_mim !== undefined
        || data.vendido !== undefined
    ) {
        return {
            id: fallbackProdutoId,
            status: data.status,
            reservado: data.reservado,
            reservadoPorMim: data.reservadoPorMim,
            reservado_por_mim: data.reservado_por_mim,
            reservadoAte: data.reservadoAte,
            reservado_ate: data.reservado_ate,
            vendido: data.vendido,
            checkoutUrl: data.checkoutUrl,
            gatewayUrl: data.gatewayUrl,
            url: data.url,
        };
    }

    return null;
}

function getClampedImageIndex(product: DailyProduct, imageIndex?: number) {
    return Math.min(Math.max(imageIndex ?? 0, 0), Math.max(product.images.length - 1, 0));
}

function getDailyProductActionState(
    product: DailyProduct,
    isExpanded: boolean,
    isCreatingCheckout: boolean,
) {
    if (isCreatingCheckout) {
        return {
            label: 'Criando...',
            disabled: true,
            unavailable: false,
            shouldRedeem: false,
        };
    }

    if (product.status === 'VENDIDO') {
        return {
            label: 'Item vendido',
            disabled: true,
            unavailable: true,
            shouldRedeem: false,
        };
    }

    if (product.status === 'RESERVADO' && !product.reservadoPorMim) {
        return {
            label: 'Alguém resgatando Item',
            disabled: true,
            unavailable: true,
            shouldRedeem: false,
        };
    }

    if (product.status === 'RESERVADO' && product.reservadoPorMim) {
        return {
            label: 'Continuar pagamento',
            disabled: false,
            unavailable: false,
            shouldRedeem: true,
        };
    }

    return {
        label: isExpanded ? 'Resgatar Item' : 'Ver item',
        disabled: false,
        unavailable: false,
        shouldRedeem: isExpanded,
    };
}

function findUpdatedDailyProduct(products: DailyProduct[], product: DailyProduct) {
    return products.find((currentProduct) => currentProduct.clientKey === product.clientKey)
        ?? products.find((currentProduct) => currentProduct.id === product.id)
        ?? null;
}

export function RoletaVipScreen() {
    const location = useLocation();
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const isAuthenticated = isCookieAuthMode ? Boolean(user) : Boolean(token && user);
    const [roleta, setRoleta] = useState<RoletaViewState>(emptyRoletaState);
    const [activeTab, setActiveTab] = useState<RoletaTab>(getInitialRoletaTabFromUrl);
    const [isLoading, setIsLoading] = useState(true);
    const [isSpinning, setIsSpinning] = useState(false);
    const [wheelRotation, setWheelRotation] = useState(0);
    const [error, setError] = useState('');
    const [dailyProducts, setDailyProducts] = useState<DailyProduct[]>([]);
    const [activeImageByProductId, setActiveImageByProductId] = useState<Record<string, number>>({});
    const [activeProductIndex, setActiveProductIndex] = useState(0);
    const [viewedDailyProductIds, setViewedDailyProductIds] = useState<Record<string, boolean>>({});
    const [dailyCarouselProgress, setDailyCarouselProgress] = useState(0);
    const [expandedDailyProductIds, setExpandedDailyProductIds] = useState<Record<string, boolean>>({});
    const [isDailyLoading, setIsDailyLoading] = useState(false);
    const [dailyError, setDailyError] = useState('');
    const [dailyCheckoutProductId, setDailyCheckoutProductId] = useState<string | null>(null);
    const [dailyCheckoutErrorByProductId, setDailyCheckoutErrorByProductId] = useState<Record<string, string>>({});
    const [hasLoadedDailyProducts, setHasLoadedDailyProducts] = useState(false);
    const [sharedProductId, setSharedProductId] = useState(getInitialSharedProductIdFromUrl);
    const [sharedProductMessage, setSharedProductMessage] = useState('');
    const [dailyShareFeedbackByProductId, setDailyShareFeedbackByProductId] = useState<Record<string, string>>({});
    const [inviteUrl, setInviteUrl] = useState('');
    const [isInviteLoading, setIsInviteLoading] = useState(false);
    const [inviteError, setInviteError] = useState('');
    const [inviteCopyLabel, setInviteCopyLabel] = useState('Copiar link');
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const fetchRoletaInFlightRef = useRef(false);
    const dailyCarouselRef = useRef<HTMLDivElement | null>(null);
    const dailyCheckoutInFlightRef = useRef(false);
    const isAdjustingDailyCarouselLoopRef = useRef(false);
    const dailyShareFeedbackTimeoutRef = useRef<number | null>(null);
    const dailyCardGestureRef = useRef({
        hasDragged: false,
        startX: 0,
        startY: 0,
    });
    const dailyProductBarGestureRef = useRef({
        hasMoved: false,
        startX: 0,
        suppressNextClick: false,
    });
    const hasGroupGoal = roleta.hasMeta && roleta.metaGrupo > 0;
    const groupGoalTitle = roleta.metaAtual?.titulo || 'Meta atual do grupo';
    const progressPercent = useMemo(() => {
        if (!hasGroupGoal) return 0;

        return Math.min(100, Math.max(0, (roleta.progressoGrupo / roleta.metaGrupo) * 100));
    }, [hasGroupGoal, roleta.metaGrupo, roleta.progressoGrupo]);

    const authRefreshKey = isAuthenticated
        ? String(user?.id ?? user?.telefone ?? user?.phone ?? token ?? 'cookie-session')
        : 'guest';
    const wheelGradient = useMemo(() => createWheelGradient(roleta.opcoes), [roleta.opcoes]);
    const hasWheelOptions = roleta.opcoes.length > 0;
    const canSpin = isAuthenticated && roleta.ativa && roleta.girosDisponiveis > 0 && hasWheelOptions && !isSpinning;
    const currentPrize = roleta.premioAtual;
    const visibleInviteUrl = isAuthenticated ? inviteUrl : '';
    const loopedDailyProducts = useMemo(() => {
        if (dailyProducts.length <= 1) {
            return dailyProducts.map((product, productIndex) => ({
                product,
                productIndex,
                renderKey: product.clientKey,
            }));
        }

        return Array.from({ length: dailyProducts.length * 3 }, (_, renderIndex) => {
            const productIndex = renderIndex % dailyProducts.length;
            const product = dailyProducts[productIndex];

            return {
                product,
                productIndex,
                renderKey: `${product.clientKey}-${renderIndex}`,
            };
        });
    }, [dailyProducts]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const queryTab = params.get('aba');
        const queryProductId = params.get('produto')?.trim() ?? '';

        if (queryTab === DAILY_TAB_QUERY_VALUE) {
            setActiveTab('daily');
        }

        setSharedProductId(queryProductId);
        setSharedProductMessage('');
    }, [location.search]);

    useEffect(() => () => {
        if (dailyShareFeedbackTimeoutRef.current) {
            window.clearTimeout(dailyShareFeedbackTimeoutRef.current);
        }
    }, []);

    const fetchRoleta = useCallback(async () => {
        if (fetchRoletaInFlightRef.current) return;

        fetchRoletaInFlightRef.current = true;
        setIsLoading(true);
        setError('');

        try {
            const { data } = await runWithRoletaParticipantRetry(() => (
                api.get<RoletaStatusApi>(apiRoutes.roleta.status)
            ));
            const nextRoleta = mergeLocalNotificationsIntoRoleta(normalizeRoletaStatus(data));
            setRoleta(nextRoleta);
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
            fetchRoletaInFlightRef.current = false;
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchRoleta();
    }, [authRefreshKey, fetchRoleta]);

    const fetchInviteUrl = useCallback(async () => {
        if (!isAuthenticated) {
            setInviteUrl('');
            setInviteError('');
            setIsInviteLoading(false);
            return;
        }

        setIsInviteLoading(true);
        setInviteError('');

        try {
            const { data } = await api.get<IndicacaoLinkApiLike>(apiRoutes.indicacoes.meuLink);
            let nextInviteUrl = normalizeInviteUrl(data);

            if (!nextInviteUrl) {
                const createdInvite = await api.post<IndicacaoLinkApiLike>(apiRoutes.indicacoes.meuLink);
                nextInviteUrl = normalizeInviteUrl(createdInvite.data);
            }

            if (!nextInviteUrl) {
                throw new Error('Indicacao sem URL.');
            }

            setInviteUrl(nextInviteUrl);
        } catch {
            setInviteError('Nao foi possivel carregar seu link.');
        } finally {
            setIsInviteLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) {
            setInviteUrl('');
            setInviteError('');
            setIsInviteLoading(false);
            return;
        }

        if (isLoading || fetchRoletaInFlightRef.current) return;

        void fetchInviteUrl();
    }, [fetchInviteUrl, isAuthenticated, isLoading]);

    const fetchDailyProducts = useCallback(async () => {
        setIsDailyLoading(true);
        setDailyError('');

        try {
            const { data } = await api.get<RoletaProdutoApi[] | RoletaProdutosResponse>(apiRoutes.roleta.produtos);
            const nextProducts = normalizeDailyProductsResponse(data);
            setDailyProducts(nextProducts);
            setViewedDailyProductIds(nextProducts[0] ? { [nextProducts[0].clientKey]: true } : {});
            setActiveProductIndex(0);
            setDailyCarouselProgress(0);
            setHasLoadedDailyProducts(true);
            return nextProducts;
        } catch (dailyProductsError) {
            setDailyError(getRoletaErrorMessage(dailyProductsError));
            setHasLoadedDailyProducts(true);
            return [];
        } finally {
            setIsDailyLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'daily' && !hasLoadedDailyProducts && !isDailyLoading) {
            void fetchDailyProducts();
        }
    }, [activeTab, fetchDailyProducts, hasLoadedDailyProducts, isDailyLoading]);

    const syncDailyProductFromApi = useCallback((clientKey: string, apiProduct: RoletaProdutoApi) => {
        setDailyProducts((currentProducts) => (
            currentProducts.map((currentProduct, productIndex) => (
                currentProduct.clientKey === clientKey
                    ? normalizeDailyProduct(apiProduct, productIndex, currentProduct)
                    : currentProduct
            ))
        ));
    }, []);

    useEffect(() => {
        const syncRoletaOnReturn = () => {
            if (document.visibilityState !== 'visible') return;

            void fetchRoleta();

            if (activeTab === 'daily' || hasLoadedDailyProducts) {
                void fetchDailyProducts();
            }
        };

        window.addEventListener('focus', syncRoletaOnReturn);
        document.addEventListener('visibilitychange', syncRoletaOnReturn);

        return () => {
            window.removeEventListener('focus', syncRoletaOnReturn);
            document.removeEventListener('visibilitychange', syncRoletaOnReturn);
        };
    }, [activeTab, fetchDailyProducts, fetchRoleta, hasLoadedDailyProducts]);

    const handleSpin = async () => {
        if (!canSpin) return;

        setIsSpinning(true);
        setError('');

        try {
            const { data } = await api.post<RoletaGiroResponse>(apiRoutes.roleta.girar);
            const statusPayload = data.roleta ?? (hasRoletaStatusPayload(data) ? data : null);
            const rawPrize = getPremioAtualFromSpin(data) ?? getPremioAtualFromStatus(statusPayload);
            const normalizedStatus = statusPayload
                ? mergeLocalNotificationsIntoRoleta(normalizeRoletaStatus(statusPayload))
                : null;
            const responseRoleta = normalizedStatus && !data.roleta
                ? {
                    ...roleta,
                    ...normalizedStatus,
                    urlConvite: normalizedStatus.urlConvite || roleta.urlConvite,
                    notificacoes: normalizedStatus.notificacoes.length
                        ? normalizedStatus.notificacoes
                        : roleta.notificacoes,
                    opcoes: normalizedStatus.opcoes.length ? normalizedStatus.opcoes : roleta.opcoes,
                    ...(!hasMetaPayloadFields(statusPayload) ? {
                        hasMeta: roleta.hasMeta,
                        metaAtual: roleta.metaAtual,
                        metaGrupo: roleta.metaGrupo,
                        progressoGrupo: roleta.progressoGrupo,
                        girosBonusGrupo: roleta.girosBonusGrupo,
                    } : {}),
                }
                : normalizedStatus;
            const slicesForSpin = responseRoleta?.opcoes.length ? responseRoleta.opcoes : roleta.opcoes;
            const nextPrize = createPrizeView(rawPrize, slicesForSpin);
            const targetSliceIndex = getPrizeSliceIndex(rawPrize, slicesForSpin);
            const targetSliceOffsetDegrees = getRandomSliceOffsetDegrees(slicesForSpin.length);

            setWheelRotation((currentRotation) => createTargetWheelRotation(
                currentRotation,
                targetSliceIndex,
                slicesForSpin.length,
                targetSliceOffsetDegrees,
            ));
            await waitForAnimation(WHEEL_SPIN_DURATION_MS);

            if (responseRoleta) {
                setRoleta(nextPrize ? { ...responseRoleta, premioAtual: nextPrize } : responseRoleta);
            } else if (
                nextPrize
                || data.girosDisponiveis !== undefined
                || data.giros_disponiveis !== undefined
            ) {
                setRoleta((currentRoleta) => ({
                    ...currentRoleta,
                    premioAtual: nextPrize,
                    girosDisponiveis: data.girosDisponiveis !== undefined || data.giros_disponiveis !== undefined
                        ? Math.max(0, Math.floor(parseApiNumber(
                            data.girosDisponiveis ?? data.giros_disponiveis,
                        )))
                        : currentRoleta.girosDisponiveis,
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

    const handleRedeemDailyProduct = async (product: DailyProduct) => {
        if (!isAuthenticated) {
            setDailyCheckoutErrorByProductId((currentErrors) => ({
                ...currentErrors,
                [product.clientKey]: 'Entre para continuar o resgate.',
            }));
            return;
        }

        if (product.status === 'VENDIDO' || (product.status === 'RESERVADO' && !product.reservadoPorMim)) {
            return;
        }

        if (product.status === 'RESERVADO' && product.reservadoPorMim) {
            if (product.checkoutUrl) {
                window.location.href = product.checkoutUrl;
                return;
            }

            if (dailyCheckoutInFlightRef.current) return;

            dailyCheckoutInFlightRef.current = true;
            setDailyCheckoutProductId(product.clientKey);
            setDailyCheckoutErrorByProductId((currentErrors) => {
                const { [product.clientKey]: _removedError, ...nextErrors } = currentErrors;
                return nextErrors;
            });

            try {
                const refreshedProducts = await fetchDailyProducts();
                const refreshedProduct = findUpdatedDailyProduct(refreshedProducts, product);

                if (refreshedProduct?.status === 'RESERVADO' && refreshedProduct.reservadoPorMim && refreshedProduct.checkoutUrl) {
                    window.location.href = refreshedProduct.checkoutUrl;
                    return;
                }

                setDailyCheckoutErrorByProductId((currentErrors) => ({
                    ...currentErrors,
                    [product.clientKey]: 'Pagamento em andamento. Aguarde ou tente atualizar.',
                }));
            } finally {
                dailyCheckoutInFlightRef.current = false;
                setDailyCheckoutProductId(null);
            }

            return;
        }

        if (dailyCheckoutInFlightRef.current) return;

        dailyCheckoutInFlightRef.current = true;
        setDailyCheckoutProductId(product.clientKey);
        setDailyCheckoutErrorByProductId((currentErrors) => {
            const { [product.clientKey]: _removedError, ...nextErrors } = currentErrors;
            return nextErrors;
        });

        try {
            const { data } = await api.post<ProdutoCheckoutResponse>(
                apiRoutes.roleta.resgatarProduto(product.id),
                { produtoId: product.id },
            );
            const updatedProduct = getDailyProductFromCheckoutResponse(data, product.id);

            if (updatedProduct) {
                syncDailyProductFromApi(product.clientKey, updatedProduct);
            }

            const checkoutUrl = getCheckoutUrlFromResponse(data)
                || (updatedProduct ? normalizeDailyProductCheckoutUrl(updatedProduct) : '');

            if (!checkoutUrl) {
                await fetchDailyProducts();
                throw new Error('Checkout sem URL de redirecionamento.');
            }

            const localNotification = createLocalPrizeUseNotification(product);
            pushLocalRouletteNotification(localNotification);
            setRoleta((currentRoleta) => ({
                ...currentRoleta,
                notificacoes: sortRoletaNotificationsByNewest([
                    localNotification,
                    ...currentRoleta.notificacoes.filter((notification) => notification.id !== localNotification.id),
                ]),
            }));
            await fetchRoleta();
            await fetchDailyProducts();
            window.location.href = checkoutUrl;
        } catch (checkoutError) {
            if (axios.isAxiosError(checkoutError) && [401, 403].includes(checkoutError.response?.status ?? 0)) {
                logout();
            }

            if (axios.isAxiosError(checkoutError) && checkoutError.response?.data) {
                const updatedProduct = getDailyProductFromCheckoutResponse(
                    checkoutError.response.data as ProdutoCheckoutResponse,
                    product.id,
                );

                if (updatedProduct) {
                    syncDailyProductFromApi(product.clientKey, updatedProduct);
                }
            }

            const refreshedProducts = await fetchDailyProducts();
            const refreshedProduct = findUpdatedDailyProduct(refreshedProducts, product);

            if (
                refreshedProduct?.status === 'VENDIDO'
                || (refreshedProduct?.status === 'RESERVADO' && !refreshedProduct.reservadoPorMim)
            ) {
                setDailyCheckoutErrorByProductId((currentErrors) => {
                    const { [product.clientKey]: _removedError, ...nextErrors } = currentErrors;
                    return nextErrors;
                });
                return;
            }

            if (refreshedProduct?.status === 'RESERVADO' && refreshedProduct.reservadoPorMim && refreshedProduct.checkoutUrl) {
                setDailyCheckoutErrorByProductId((currentErrors) => {
                    const { [product.clientKey]: _removedError, ...nextErrors } = currentErrors;
                    return nextErrors;
                });
                return;
            }

            if (isCheckoutInProgressError(checkoutError)) {
                setDailyCheckoutErrorByProductId((currentErrors) => ({
                    ...currentErrors,
                    [product.clientKey]: 'Pagamento em andamento. Aguarde ou tente atualizar.',
                }));
                return;
            }

            setDailyCheckoutErrorByProductId((currentErrors) => ({
                ...currentErrors,
                [product.clientKey]: getRoletaCheckoutErrorMessage(checkoutError),
            }));
        } finally {
            dailyCheckoutInFlightRef.current = false;
            setDailyCheckoutProductId(null);
        }
    };

    const setDailyProductImage = (product: DailyProduct, direction: -1 | 1) => {
        setActiveImageByProductId((currentImages) => {
            const currentImageIndex = getClampedImageIndex(product, currentImages[product.clientKey]);
            const nextImageIndex = getClampedImageIndex(product, currentImageIndex + direction);

            return {
                ...currentImages,
                [product.clientKey]: nextImageIndex,
            };
        });
    };

    const selectDailyProductImage = (productKey: string, imageIndex: number) => {
        setActiveImageByProductId((currentImages) => ({
            ...currentImages,
            [productKey]: imageIndex,
        }));
    };

    const clampDailyCarouselProgress = (progress: number) => Math.min(Math.max(progress, 0), 1);

    const getDailyProductIndexFromRenderIndex = (renderIndex: number) => {
        if (dailyProducts.length === 0) return 0;

        return ((renderIndex % dailyProducts.length) + dailyProducts.length) % dailyProducts.length;
    };

    const getMiddleDailyRenderIndex = (productIndex: number) => (
        dailyProducts.length > 1 ? dailyProducts.length + productIndex : productIndex
    );

    const getDailyProductIndexFromProgress = (progress: number) => {
        if (dailyProducts.length <= 1) return 0;

        return Math.min(
            Math.round(clampDailyCarouselProgress(progress) * (dailyProducts.length - 1)),
            dailyProducts.length - 1,
        );
    };

    const scrollDailyCarouselToRenderIndex = (renderIndex: number, behavior: ScrollBehavior = 'auto') => {
        const carousel = dailyCarouselRef.current;

        if (!carousel) return;

        const targetCard = carousel.children.item(renderIndex);
        if (!(targetCard instanceof HTMLElement)) return;

        const carouselRect = carousel.getBoundingClientRect();
        const targetRect = targetCard.getBoundingClientRect();
        const nextLeft = targetRect.left
            + (targetRect.width / 2)
            - carouselRect.left
            - (carouselRect.width / 2)
            + carousel.scrollLeft;

        if (behavior === 'smooth') {
            carousel.scrollTo({ left: nextLeft, behavior });
            return;
        }

        carousel.scrollLeft = nextLeft;
    };

    const moveDailyCarouselLoopSilently = (
        carousel: HTMLDivElement,
        currentRenderIndex: number,
        targetRenderIndex: number,
    ) => {
        const currentCard = carousel.children.item(currentRenderIndex);
        const targetCard = carousel.children.item(targetRenderIndex);

        if (!(currentCard instanceof HTMLElement) || !(targetCard instanceof HTMLElement)) return;

        const offsetDelta = targetCard.getBoundingClientRect().left - currentCard.getBoundingClientRect().left;
        carousel.scrollLeft += offsetDelta;
    };

    const scrollDailyCarouselToProgress = (progress: number, behavior: ScrollBehavior = 'auto') => {
        const safeProgress = clampDailyCarouselProgress(progress);
        const productIndex = getDailyProductIndexFromProgress(safeProgress);

        setDailyCarouselProgress(safeProgress);
        setActiveProductIndex(productIndex);
        scrollDailyCarouselToRenderIndex(getMiddleDailyRenderIndex(productIndex), behavior);
    };

    useEffect(() => {
        const activeProduct = dailyProducts[activeProductIndex];
        if (!activeProduct) return;

        setViewedDailyProductIds((current) => current[activeProduct.clientKey]
            ? current
            : { ...current, [activeProduct.clientKey]: true });
    }, [activeProductIndex, dailyProducts]);

    const handleDailyCarouselScroll = (event: UIEvent<HTMLDivElement>) => {
        if (isAdjustingDailyCarouselLoopRef.current) return;

        const target = event.currentTarget;

        const carouselRect = target.getBoundingClientRect();
        const carouselCenter = carouselRect.left + (carouselRect.width / 2);
        const nearestRenderIndex = Array.from(target.children).reduce((nearestIndex, child, childIndex) => {
            if (!(child instanceof HTMLElement)) return nearestIndex;

            const childRect = child.getBoundingClientRect();
            const childDistance = Math.abs(childRect.left + (childRect.width / 2) - carouselCenter);
            const currentNearest = target.children.item(nearestIndex);
            const nearestRect = currentNearest instanceof HTMLElement
                ? currentNearest.getBoundingClientRect()
                : null;
            const nearestDistance = nearestRect
                ? Math.abs(nearestRect.left + (nearestRect.width / 2) - carouselCenter)
                : Number.POSITIVE_INFINITY;

            return childDistance < nearestDistance ? childIndex : nearestIndex;
        }, 0);
        const nextIndex = getDailyProductIndexFromRenderIndex(nearestRenderIndex);

        setActiveProductIndex(nextIndex);
        setDailyCarouselProgress(dailyProducts.length > 1 ? nextIndex / (dailyProducts.length - 1) : 0);

        if (
            dailyProducts.length > 1
            && !isAdjustingDailyCarouselLoopRef.current
            && (nearestRenderIndex < dailyProducts.length || nearestRenderIndex >= dailyProducts.length * 2)
        ) {
            isAdjustingDailyCarouselLoopRef.current = true;
            moveDailyCarouselLoopSilently(target, nearestRenderIndex, getMiddleDailyRenderIndex(nextIndex));
            window.setTimeout(() => {
                isAdjustingDailyCarouselLoopRef.current = false;
            }, 0);
        }
    };

    const scrollToDailyProduct = (productIndex: number, behavior: ScrollBehavior = 'smooth') => {
        const safeProductIndex = Math.min(Math.max(productIndex, 0), Math.max(dailyProducts.length - 1, 0));

        setActiveProductIndex(safeProductIndex);
        setDailyCarouselProgress(dailyProducts.length > 1 ? safeProductIndex / (dailyProducts.length - 1) : 0);
        scrollDailyCarouselToRenderIndex(getMiddleDailyRenderIndex(safeProductIndex), behavior);
    };

    useEffect(() => {
        if (activeTab !== 'daily' || !hasLoadedDailyProducts || isDailyLoading || !sharedProductId) return;

        const productIndex = dailyProducts.findIndex((product) => product.id === sharedProductId);

        if (productIndex < 0) {
            setSharedProductMessage('Item não está mais disponível.');
            scrollToDailyProduct(0, 'auto');
            return;
        }

        setSharedProductMessage('');
        setExpandedDailyProductIds((currentExpandedIds) => {
            const product = dailyProducts[productIndex];
            if (!product || !currentExpandedIds[product.clientKey]) return currentExpandedIds;

            const { [product.clientKey]: _removedExpandedProduct, ...nextExpandedIds } = currentExpandedIds;
            return nextExpandedIds;
        });
        const frameId = window.requestAnimationFrame(() => {
            isAdjustingDailyCarouselLoopRef.current = true;
            scrollToDailyProduct(productIndex, 'auto');
            window.setTimeout(() => {
                isAdjustingDailyCarouselLoopRef.current = false;
            }, 0);
        });

        return () => window.cancelAnimationFrame(frameId);
    }, [activeTab, dailyProducts, hasLoadedDailyProducts, isDailyLoading, sharedProductId]);

    useEffect(() => {
        if (activeTab !== 'daily' || dailyProducts.length <= 1 || sharedProductId) return undefined;

        const frameId = window.requestAnimationFrame(() => {
            isAdjustingDailyCarouselLoopRef.current = true;
            scrollDailyCarouselToRenderIndex(getMiddleDailyRenderIndex(activeProductIndex));
            window.setTimeout(() => {
                isAdjustingDailyCarouselLoopRef.current = false;
            }, 0);
        });

        return () => window.cancelAnimationFrame(frameId);
    }, [activeTab, dailyProducts.length, sharedProductId]);

    const handleDailyProductBarPointer = (event: PointerEvent<HTMLDivElement>) => {
        if (event.type === 'pointermove' && event.buttons !== 1) return;
        if (dailyProducts.length === 0) return;

        if (event.type === 'pointerdown') {
            dailyProductBarGestureRef.current = {
                hasMoved: false,
                startX: event.clientX,
                suppressNextClick: false,
            };
            event.currentTarget.setPointerCapture(event.pointerId);
        }

        if (event.type === 'pointermove') {
            dailyProductBarGestureRef.current.hasMoved = Math.abs(
                event.clientX - dailyProductBarGestureRef.current.startX,
            ) > 4;
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

        if (dailyProductBarGestureRef.current.hasMoved) {
            dailyProductBarGestureRef.current.suppressNextClick = true;
            window.setTimeout(() => {
                dailyProductBarGestureRef.current.suppressNextClick = false;
            }, 120);
        }
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

        if (!expandedDailyProductIds[product.clientKey]) {
            setActiveImageByProductId((currentImages) => ({
                ...currentImages,
                [product.clientKey]: product.images.length > 1 ? 1 : 0,
            }));
            setExpandedDailyProductIds((currentExpandedIds) => ({
                ...currentExpandedIds,
                [product.clientKey]: true,
            }));
            return;
        }

        const rect = event.currentTarget.getBoundingClientRect();
        const direction = event.clientX - rect.left < rect.width / 2 ? -1 : 1;
        setDailyProductImage(product, direction);
    };

    const showDailyShareFeedback = (productKey: string, message: string) => {
        if (dailyShareFeedbackTimeoutRef.current) {
            window.clearTimeout(dailyShareFeedbackTimeoutRef.current);
        }

        setDailyShareFeedbackByProductId({
            [productKey]: message,
        });
        dailyShareFeedbackTimeoutRef.current = window.setTimeout(() => {
            setDailyShareFeedbackByProductId({});
        }, 1800);
    };

    const buildDailyProductShareUrl = (product: DailyProduct) => {
        const shareUrl = new URL('/vip/roleta', window.location.origin);
        const currentParams = new URLSearchParams(location.search);
        const refCode = currentParams.get('ref')?.trim();

        if (refCode) {
            shareUrl.searchParams.set('ref', refCode);
        }

        shareUrl.searchParams.set('aba', DAILY_TAB_QUERY_VALUE);
        shareUrl.searchParams.set('produto', product.id);

        return shareUrl.toString();
    };

    const handleShareDailyProduct = async (
        event: MouseEvent<HTMLButtonElement>,
        product: DailyProduct,
    ) => {
        event.stopPropagation();

        const shareUrl = buildDailyProductShareUrl(product);

        try {
            if (navigator.share) {
                await navigator.share({
                    title: product.nome,
                    text: 'Olha esse item do Brechó da Cami',
                    url: shareUrl,
                });
                return;
            }

            if (!navigator.clipboard) {
                throw new Error('Clipboard indisponivel.');
            }

            await navigator.clipboard.writeText(shareUrl);
            showDailyShareFeedback(product.clientKey, 'Link copiado');
        } catch (shareError) {
            if (shareError instanceof DOMException && shareError.name === 'AbortError') return;

            showDailyShareFeedback(product.clientKey, 'Não foi possível copiar');
        }
    };

    const handleCopyInviteUrl = async () => {
        if (!visibleInviteUrl || isInviteLoading) return;

        try {
            await navigator.clipboard.writeText(visibleInviteUrl);
            setInviteCopyLabel('Copiado');
            window.setTimeout(() => setInviteCopyLabel('Copiar link'), 1800);
        } catch {
            setInviteCopyLabel('Erro');
            window.setTimeout(() => setInviteCopyLabel('Copiar link'), 1800);
        }
    };

    const roletaInfoFooter = (
        <footer className={`roleta-vip-info-footer roleta-vip-info-footer--${activeTab}`}>
            <p>
                Benefícios resgatados na roleta valem somente para os itens diários,<br />
                todos os itens atualizam em 24 horas.
            </p>

            <p>
                Local — Cidade alta, Borges de Medeiros n°539/03
            </p>
        </footer>
    );

    return (
        <div className="roleta-vip-page">
            <main className="roleta-vip-shell" aria-busy={isLoading}>
                <section className="roleta-vip-top" aria-label="Resumo da roleta VIP">
                    <div className="roleta-vip-header">
                        <h1 className="roleta-vip-title">
                            <BrechoDaCamiLogo className="roleta-vip-logo" />
                        </h1>
                        <div className="roleta-vip-profile-cta">
                            <button
                                type="button"
                                className="roleta-vip-profile-button"
                                onClick={() => setIsProfileModalOpen(true)}
                                aria-label="Abrir perfil"
                            >
                                <span>{formatCurrencyBRL(roleta.valorDisponivelResgate)}</span>
                                <AppIcon name="perfil" size={16} />
                            </button>
                            <span className="roleta-vip-profile-minimum">
                                (saque mínimo de R$5,00)
                            </span>
                        </div>
                    </div>

                    <section className="roleta-vip-group-goal" aria-label="Meta atual do grupo">
                        <RoletaNotificationsStory notifications={roleta.notificacoes} />

                        {hasGroupGoal ? (
                            <>
                                <div className="roleta-vip-group-goal-row">
                                    <span>{groupGoalTitle}</span>
                                    <strong>{roleta.progressoGrupo}/{roleta.metaGrupo}</strong>
                                </div>
                                <div className="roleta-vip-group-progress" aria-hidden="true">
                                    <span style={{ width: `${progressPercent}%` }} />
                                </div>
                                <p>
                                    {roleta.metaGrupo} acoes -&gt; + {roleta.girosBonusGrupo} giros pra todos.
                                </p>
                            </>
                        ) : (
                            <p className="roleta-vip-group-goal-empty">
                                Nenhuma meta ativa no momento.
                            </p>
                        )}
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
                                    <div className="roleta-vip-wheel-needle" aria-hidden="true" />
                                    <div className="roleta-vip-wheel-frame">
                                        <div className="roleta-vip-wheel-inner-border">
                                            <motion.div
                                                className="roleta-vip-wheel-face"
                                                animate={{ rotate: wheelRotation }}
                                                transition={{ duration: WHEEL_SPIN_DURATION_MS / 1000, ease: [0.08, 0.82, 0.18, 1] }}
                                                style={{ background: wheelGradient }}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="roleta-vip-wheel-center-button"
                                            onClick={() => void handleSpin()}
                                            disabled={!canSpin}
                                        >
                                            {isSpinning ? '' : 'girar'}
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

                                <div className={`roleta-vip-spin-actions${currentPrize ? ' has-prize' : ''}`}>
                                    <button
                                        type="button"
                                        className="roleta-vip-main-spin-button"
                                        onClick={() => void handleSpin()}
                                        disabled={!canSpin}
                                    >
                                        {isSpinning ? 'Girando...' : 'Girar a roleta'}
                                    </button>

                                    {currentPrize && (
                                        <button
                                            type="button"
                                            className="roleta-vip-prize-use-button"
                                            style={{
                                                backgroundColor: currentPrize.nivelCor,
                                                color: '#000000',
                                                WebkitTextStroke: '0.25px #000000',
                                                boxShadow: '1px 1px 10px #fff6f1'
                                            }}
                                            onClick={() => setActiveTab('daily')}
                                        >
                                            Usar {removePrizeNegativeSign(currentPrize.valorLabel || formatCurrencyBRL(Math.abs(currentPrize.valor)))}
                                        </button>
                                    )}
                                </div>

                                {!isLoading && roleta.girosDisponiveis < 1 && (
                                    <p className="roleta-vip-no-spins">
                                        Voce ainda nao tem giros disponiveis.
                                    </p>
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
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDailyError('');
                                                void fetchDailyProducts();
                                            }}
                                        >
                                            Tentar novamente
                                        </button>
                                    </div>
                                )}

                                {!isDailyLoading && !dailyError && dailyProducts.length === 0 && (
                                    <div className="roleta-vip-daily-state">Nenhum item diario disponivel.</div>
                                )}

                                {!isDailyLoading && !dailyError && sharedProductMessage && (
                                    <p className="roleta-vip-daily-inline-message" role="status">
                                        {sharedProductMessage}
                                    </p>
                                )}

                                {!isDailyLoading && !dailyError && dailyProducts.length > 0 && (
                                    <motion.div
                                        ref={dailyCarouselRef}
                                        className="roleta-vip-daily-carousel"
                                        aria-label={`Itens diarios, item ${activeProductIndex + 1} de ${dailyProducts.length}`}
                                        onScroll={handleDailyCarouselScroll}
                                    >
                                        {loopedDailyProducts.map(({ product, renderKey }) => {
                                        const activeImageIndex = getClampedImageIndex(
                                            product,
                                            activeImageByProductId[product.clientKey],
                                        );
                                        const mainImage = product.images[0];
                                        const isExpanded = Boolean(expandedDailyProductIds[product.clientKey]);
                                        const detailImageIndex = activeImageIndex;
                                        const visibleImageIndex = isExpanded ? detailImageIndex : 0;
                                        const activeImage = product.images[getClampedImageIndex(product, detailImageIndex)];
                                        const checkoutError = dailyCheckoutErrorByProductId[product.clientKey];
                                        const isCreatingCheckout = dailyCheckoutProductId === product.clientKey;
                                        const actionState = getDailyProductActionState(product, isExpanded, isCreatingCheckout);
                                        const discountedPricePreview = getDiscountedPricePreview(product, currentPrize);
                                        const hasActivePrizeAction = actionState.label === 'Resgatar Item'
                                            && Boolean(discountedPricePreview && currentPrize);
                                        const dailyActionLabel = hasActivePrizeAction && currentPrize
                                            ? `Usar ${removePrizeNegativeSign(currentPrize.valorLabel || formatCurrencyBRL(Math.abs(currentPrize.valor)))}`
                                            : actionState.label;
                                        const dailyActionStyle = hasActivePrizeAction && currentPrize?.nivelCor
                                            ? {
                                                backgroundColor: currentPrize.nivelCor,
                                                color: shouldUseDarkTextForPrizeLevel(currentPrize) ? '#000000' : '#ffffff',
                                            }
                                            : undefined;
                                        const shareFeedback = dailyShareFeedbackByProductId[product.clientKey];

                                        return (
                                            <motion.article
                                                    className="roleta-vip-daily-item"
                                                    key={renderKey}
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
                                                                isExpanded ? (
                                                                    <button
                                                                        type="button"
                                                                        key={`${image}-${imageIndex}`}
                                                                        className={imageIndex === visibleImageIndex ? 'is-active' : ''}
                                                                        onClick={() => selectDailyProductImage(product.clientKey, imageIndex)}
                                                                        aria-label={`Ver foto ${imageIndex + 1}`}
                                                                    />
                                                                ) : (
                                                                    <span
                                                                        key={`${image}-${imageIndex}`}
                                                                        className={imageIndex === visibleImageIndex ? 'is-active' : ''}
                                                                    />
                                                                )
                                                            ))}
                                                        </div>

                                                        <button
                                                            type="button"
                                                            className="roleta-vip-daily-share-button"
                                                            onClick={(event) => void handleShareDailyProduct(event, product)}
                                                            aria-label={`Compartilhar ${product.nome}`}
                                                        >
                                                            <img src={compartilhamentoIcon} alt="" aria-hidden="true" draggable={false} />
                                                        </button>

                                                        {shareFeedback && (
                                                            <span className="roleta-vip-daily-share-feedback" role="status">
                                                                {shareFeedback}
                                                            </span>
                                                        )}

                                                        {isExpanded ? (
                                                            <>
                                                                <span className="roleta-vip-daily-dark-overlay" aria-hidden="true" />
                                                                <img
                                                                    className="roleta-vip-daily-floating-image"
                                                                    src={activeImage}
                                                                    alt={product.nome}
                                                                    draggable={false}
                                                                />
                                                                <div className="roleta-vip-daily-item-info">
                                                                    <strong>{product.nome}</strong>
                                                                    <span>Tam. {product.tamanho}.</span>
                                                                </div>
                                                                {product.images.length > 1 && (
                                                                    <>
                                                                        <button
                                                                            type="button"
                                                                            className="roleta-vip-daily-image-arrow roleta-vip-daily-image-arrow--left"
                                                                            aria-label={`Foto anterior de ${product.nome}`}
                                                                            disabled={detailImageIndex === 0}
                                                                            onClick={(event) => {
                                                                                event.stopPropagation();
                                                                                setDailyProductImage(product, -1);
                                                                            }}
                                                                        >
                                                                            <img src={arrowImageIcon} alt="" draggable={false} />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="roleta-vip-daily-image-arrow roleta-vip-daily-image-arrow--right"
                                                                            aria-label={`Próxima foto de ${product.nome}`}
                                                                            disabled={detailImageIndex === product.images.length - 1}
                                                                            onClick={(event) => {
                                                                                event.stopPropagation();
                                                                                setDailyProductImage(product, 1);
                                                                            }}
                                                                        >
                                                                            <img src={arrowImageIcon} alt="" draggable={false} />
                                                                        </button>
                                                                    </>
                                                                )}
                                                                {product.priceLabel && (
                                                                    discountedPricePreview ? (
                                                                        <span className="roleta-vip-daily-price roleta-vip-daily-price--discount">
                                                                            <span className="roleta-vip-daily-price-original">
                                                                                {renderPriceLabel(discountedPricePreview.originalLabel)}
                                                                            </span>
                                                                            <span className="roleta-vip-daily-price-final">
                                                                                {renderPriceLabel(discountedPricePreview.discountedLabel)}
                                                                            </span>
                                                                        </span>
                                                                    ) : (
                                                                        <span className="roleta-vip-daily-price">
                                                                            {renderPriceLabel(product.priceLabel)}
                                                                        </span>
                                                                    )
                                                                )}
                                                            </>
                                                        ) : (
                                                            <img
                                                                className="roleta-vip-daily-cover-image"
                                                                src={mainImage}
                                                                alt={product.nome}
                                                                draggable={false}
                                                            />
                                                        )}

                                                        <button
                                                            type="button"
                                                            className={`roleta-vip-daily-action${actionState.unavailable ? ' is-unavailable' : ''}`}
                                                            style={dailyActionStyle}
                                                            disabled={actionState.disabled}
                                                            onClick={(event) => {
                                                                event.stopPropagation();

                                                                if (actionState.disabled) return;

                                                                if (actionState.shouldRedeem) {
                                                                    void handleRedeemDailyProduct(product);
                                                                    return;
                                                                }

                                                                if (!isExpanded) {
                                                                    setExpandedDailyProductIds((currentExpandedIds) => ({
                                                                        ...currentExpandedIds,
                                                                        [product.clientKey]: true,
                                                                    }));
                                                                }
                                                            }}
                                                        >
                                                            {dailyActionLabel}
                                                        </button>

                                                        {isExpanded && checkoutError && (
                                                            <p className="roleta-vip-daily-card-error" role="alert">
                                                                {checkoutError}
                                                            </p>
                                                        )}
                                                    </div>

                                            </motion.article>
                                        );
                                    })}
                                </motion.div>
                            )}

                            {!isDailyLoading && !dailyError && dailyProducts.length > 0 && (
                                <div className="roleta-vip-daily-footer">
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
                                                key={dailyProduct.clientKey}
                                                className={[
                                                    viewedDailyProductIds[dailyProduct.clientKey] ? 'is-viewed' : '',
                                                    productIndex === activeProductIndex ? 'is-active' : '',
                                                ].filter(Boolean).join(' ')}
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    if (dailyProductBarGestureRef.current.suppressNextClick) {
                                                        event.preventDefault();
                                                        return;
                                                    }
                                                    scrollToDailyProduct(productIndex);
                                                }}
                                                aria-label={`Ir para produto ${productIndex + 1}: ${dailyProduct.nome}`}
                                            >
                                                {viewedDailyProductIds[dailyProduct.clientKey] && (
                                                    <span title={dailyProduct.nome}>{dailyProduct.nome}</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                        )}

                        {activeTab === 'daily' && roletaInfoFooter}
                    </div>

                    {activeTab === 'spin' && (
                        <section className="roleta-vip-invite-block" aria-label="Indique e ganhe">
                            <div className="roleta-vip-invite-card">
                                <h2>
                                    <span>Indique e</span>
                                    <strong>ganhe.</strong>
                                </h2>

                                <ol>
                                    <li>Copie seu link abaixo.</li>
                                    <li>Envie pra alguém que ainda não tem conta.</li>
                                    <li>Quando a pessoa criar a conta pelo seu link, você ganha de <strong>2 a 5</strong> giros extras na hora.</li>
                                    <li>Caso a pessoa que você indicou resgate um item, parte do valor da compra vai pra você <strong>(os valores são acumulativos)</strong>.</li>
                                </ol>

                                <div className="roleta-vip-invite-link-row">
                                    <span>
                                        {!isAuthenticated
                                            ? 'Entre para gerar seu link.'
                                            : isInviteLoading
                                                ? 'Carregando link...'
                                                : visibleInviteUrl || 'Link indisponivel.'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => void handleCopyInviteUrl()}
                                        disabled={!isAuthenticated || isInviteLoading || !visibleInviteUrl}
                                    >
                                        {inviteCopyLabel}
                                    </button>
                                </div>

                                {isAuthenticated && inviteError && (
                                    <p className="roleta-vip-invite-error" role="alert">
                                        {inviteError}
                                        <button type="button" onClick={() => void fetchInviteUrl()}>
                                            Tentar novamente
                                        </button>
                                    </p>
                                )}
                            </div>
                        </section>
                    )}

                    {activeTab === 'spin' && roletaInfoFooter}
                </section>
            </main>
            {isProfileModalOpen && (
                <RoletaProfileModal
                    valorDisponivelResgate={roleta.valorDisponivelResgate}
                    onClose={() => setIsProfileModalOpen(false)}
                />
            )}
        </div>
    );
}
