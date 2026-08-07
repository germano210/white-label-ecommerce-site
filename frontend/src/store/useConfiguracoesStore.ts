import { create } from 'zustand';
import { api } from '../utils/api';
import { apiRoutes } from '../utils/apiRoutes';

export type CondicaoCasasDecimais = 1 | 2;

interface ConfiguracoesApi {
    condicaoCasasDecimais?: number | string | null;
    condicao_casas_decimais?: number | string | null;
}

interface ConfiguracoesState {
    condicaoCasasDecimais: CondicaoCasasDecimais;
    isLoading: boolean;
    error: string | null;
    setCondicaoCasasDecimais: (casasDecimais: CondicaoCasasDecimais) => void;
    fetchPublicConfiguracoes: () => Promise<void>;
}

export function normalizeCondicaoCasasDecimais(
    value: number | string | null | undefined,
): CondicaoCasasDecimais {
    return Number(value) === 2 ? 2 : 1;
}

export function readCondicaoCasasDecimais(data: ConfiguracoesApi) {
    return normalizeCondicaoCasasDecimais(
        data.condicaoCasasDecimais ?? data.condicao_casas_decimais,
    );
}

export const useConfiguracoesStore = create<ConfiguracoesState>((set) => ({
    condicaoCasasDecimais: 1,
    isLoading: false,
    error: null,
    setCondicaoCasasDecimais: (casasDecimais) => set({
        condicaoCasasDecimais: casasDecimais,
    }),
    fetchPublicConfiguracoes: async () => {
        set({ isLoading: true, error: null });

        try {
            const { data } = await api.get<ConfiguracoesApi>(
                apiRoutes.configuracoes.publicas,
            );
            set({
                condicaoCasasDecimais: readCondicaoCasasDecimais(data),
                isLoading: false,
            });
        } catch {
            set({
                error: 'Não foi possível carregar as configurações públicas.',
                isLoading: false,
            });
        }
    },
}));
