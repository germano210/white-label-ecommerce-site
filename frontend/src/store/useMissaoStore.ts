import { create } from 'zustand';
import { api } from '../utils/api';
import { apiRoutes } from '../utils/apiRoutes';

export type MissaoIcone = 'heart' | 'sparkles' | 'shopping-bag' | 'star';

export interface Missao {
    id: string;
    titulo: string;
    descricao: string;
    meta: number;
    progresso: number;
    concluida: boolean;
    recompensaResgatada?: boolean;
    xpConcedido?: number;
    tipo: string;
    icone: MissaoIcone;
    valorBase: number;
    peso: number;
}

export interface MissaoApi {
    id?: string | number;
    titulo?: string;
    title?: string;
    descricao?: string;
    description?: string;
    meta?: number | string;
    metaProgresso?: number | string;
    meta_progresso?: number | string;
    goal?: number | string;
    progresso?: number | string;
    progress?: number | string;
    concluida?: boolean | string | number | null;
    recompensaResgatada?: boolean | string | number | null;
    recompensa_resgatada?: boolean | string | number | null;
    xpConcedido?: number | string | null;
    xp_concedido?: number | string | null;
    tipo?: string;
    tipoAcao?: string;
    tipo_acao?: string;
    type?: string;
    icone?: string;
    icon?: string;
    valorBase?: number | string;
    valor_base?: number | string;
    peso?: number | string;
}

export type MissaoApiPayload = MissaoApi[] | {
    content?: MissaoApi[];
    missoes?: MissaoApiPayload;
};

interface MissaoState {
    missoes: Missao[];
    isLoading: boolean;
    error: string | null;
    setMissoesFromApi: (data: MissaoApiPayload) => void;
    fetchMissoes: () => Promise<void>;
}

function normalizeIcon(icon?: string): MissaoIcone {
    const normalizedIcon = icon?.toLowerCase();

    if (normalizedIcon === 'shopping-bag' || normalizedIcon === 'bag' || normalizedIcon === 'sacola') {
        return 'shopping-bag';
    }

    if (normalizedIcon === 'star' || normalizedIcon === 'estrela') return 'star';
    if (normalizedIcon === 'sparkles' || normalizedIcon === 'brilho') return 'sparkles';

    return 'heart';
}

function parsePositiveInteger(value: number | string | undefined, fallback: number) {
    const parsedValue = Math.floor(Number(value));
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : fallback;
}

function parseProgress(value: number | string | undefined, meta: number) {
    const parsedValue = Math.floor(Number(value));
    const progress = Number.isFinite(parsedValue) ? parsedValue : 0;

    return Math.min(Math.max(progress, 0), meta);
}

function parseBoolean(value: boolean | string | number | null | undefined) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value !== 'string') return false;

    const normalizedValue = value.trim().toLowerCase();
    return normalizedValue === 'true' || normalizedValue === '1' || normalizedValue === 'sim';
}

function parseOptionalBoolean(value: boolean | string | number | null | undefined) {
    return value === undefined || value === null ? undefined : parseBoolean(value);
}

function parseOptionalNumber(value: number | string | null | undefined) {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

function extractMissoes(data: MissaoApiPayload): MissaoApi[] {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.content)) return data.content;
    if (data.missoes) return extractMissoes(data.missoes);

    return [];
}

function normalizeMissao(missao: MissaoApi, index: number): Missao {
    const tipo = missao.tipo ?? missao.tipoAcao ?? missao.tipo_acao ?? missao.type ?? 'GERAL';
    const meta = parsePositiveInteger(
        missao.meta ?? missao.metaProgresso ?? missao.meta_progresso ?? missao.goal,
        3,
    );
    const progresso = parseProgress(missao.progresso ?? missao.progress, meta);

    return {
        id: String(missao.id ?? `${tipo}-${index}`),
        titulo: missao.titulo ?? missao.title ?? 'Missão atual',
        descricao: missao.descricao ?? missao.description ?? 'Complete esta missão',
        meta,
        progresso,
        concluida: parseBoolean(missao.concluida),
        recompensaResgatada: parseOptionalBoolean(
            missao.recompensaResgatada ?? missao.recompensa_resgatada,
        ),
        xpConcedido: parseOptionalNumber(missao.xpConcedido ?? missao.xp_concedido),
        tipo,
        icone: normalizeIcon(missao.icone ?? missao.icon),
        valorBase: Math.max(Number(missao.valorBase ?? missao.valor_base ?? 10) || 10, 1),
        peso: Math.max(Number(missao.peso ?? 1) || 1, 1),
    };
}

export const useMissaoStore = create<MissaoState>((set) => ({
    missoes: [],
    isLoading: false,
    error: null,

    setMissoesFromApi: (data) => {
        set({
            missoes: extractMissoes(data).map(normalizeMissao),
            error: null,
        });
    },

    /**
     * Carrega as missões reais da API pública.
     * Durante a chamada a store expõe `isLoading`; se a API falhar, não cria
     * missões fictícias e grava apenas uma mensagem em `error` para a interface
     * decidir como comunicar o problema ao usuário.
     */
    fetchMissoes: async () => {
        set({ isLoading: true, error: null });

        try {
            const { data } = await api.get<MissaoApiPayload>(apiRoutes.missoes.list);

            set({
                missoes: extractMissoes(data).map(normalizeMissao),
                isLoading: false,
            });
        } catch {
            set({
                isLoading: false,
                error: 'Não foi possível carregar as missões agora.',
            });
        }
    },
}));
