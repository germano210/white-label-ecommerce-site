import { create } from 'zustand';
import { api } from '../utils/api';

export type MissaoIcone = 'heart' | 'sparkles' | 'shopping-bag' | 'star';

export interface Missao {
    id: string;
    titulo: string;
    descricao: string;
    meta: number;
    progresso: number;
    tipo: string;
    icone: MissaoIcone;
}

interface MissaoApi {
    id?: string | number;
    titulo?: string;
    title?: string;
    descricao?: string;
    description?: string;
    meta?: number;
    goal?: number;
    progresso?: number;
    progress?: number;
    tipo?: string;
    type?: string;
    icone?: string;
    icon?: string;
}

interface MissaoState {
    missoes: Missao[];
    isLoading: boolean;
    error: string;
    fetchMissoes: () => Promise<void>;
}

const fallbackMissoes: Missao[] = [
    {
        id: 'curtir-3-itens',
        titulo: 'Missão atual',
        descricao: 'Curta 3 itens diferentes',
        meta: 3,
        progresso: 0,
        tipo: 'CURTIDAS',
        icone: 'heart',
    },
    {
        id: 'proxima-missao',
        titulo: 'Próxima missão',
        descricao: 'Acesse suas curtidas',
        meta: 3,
        progresso: 0,
        tipo: 'GERAL',
        icone: 'sparkles',
    },
];

function normalizeIcon(icon?: string): MissaoIcone {
    const normalizedIcon = icon?.toLowerCase();

    if (normalizedIcon === 'shopping-bag' || normalizedIcon === 'bag' || normalizedIcon === 'sacola') {
        return 'shopping-bag';
    }

    if (normalizedIcon === 'star' || normalizedIcon === 'estrela') return 'star';
    if (normalizedIcon === 'sparkles' || normalizedIcon === 'brilho') return 'sparkles';

    return 'heart';
}

function normalizeMissao(missao: MissaoApi, index: number): Missao {
    const tipo = missao.tipo ?? missao.type ?? 'GERAL';

    return {
        id: String(missao.id ?? `${tipo}-${index}`),
        titulo: missao.titulo ?? missao.title ?? 'Missão atual',
        descricao: missao.descricao ?? missao.description ?? 'Complete esta missão',
        meta: Math.max(Number(missao.meta ?? missao.goal ?? 3) || 3, 1),
        progresso: Math.max(Number(missao.progresso ?? missao.progress ?? 0) || 0, 0),
        tipo,
        icone: normalizeIcon(missao.icone ?? missao.icon),
    };
}

export const useMissaoStore = create<MissaoState>((set) => ({
    missoes: fallbackMissoes,
    isLoading: false,
    error: '',

    fetchMissoes: async () => {
        set({ isLoading: true, error: '' });

        try {
            const { data } = await api.get<MissaoApi[] | { content?: MissaoApi[] }>('/api/missoes');
            const apiMissoes = Array.isArray(data) ? data : data.content ?? [];

            set({
                missoes: apiMissoes.length > 0
                    ? apiMissoes.map(normalizeMissao)
                    : fallbackMissoes,
                isLoading: false,
            });
        } catch {
            set({
                missoes: fallbackMissoes,
                isLoading: false,
                error: 'Não foi possível carregar as missões agora.',
            });
        }
    },
}));
