import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Heart } from 'lucide-react';
import { BrechoDaCamiLogo } from '../components/common/BrechoDaCamiLogo';
import { useAuthStore } from '../store/useAuthStore';
import { api, isCookieAuthMode } from '../utils/api';
import { apiRoutes } from '../utils/apiRoutes';
import './RoletaVipScreen.css';

type NumericApiValue = number | string | null | undefined;

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

interface RoletaStatusApi {
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
}

interface RoletaViewState {
    girosTotaisObtidos: number;
    valorDisponivelResgate: number;
    metaGrupo: number;
    progressoGrupo: number;
    girosBonusGrupo: number;
    notificacoes: string[];
}

const emptyRoletaState: RoletaViewState = {
    girosTotaisObtidos: 0,
    valorDisponivelResgate: 0,
    metaGrupo: 20,
    progressoGrupo: 0,
    girosBonusGrupo: 0,
    notificacoes: [],
};

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

function normalizeRoletaStatus(data?: RoletaStatusApi | null): RoletaViewState {
    const metaGrupo = Math.max(1, Math.floor(parseApiNumber(data?.metaGrupo ?? data?.meta_grupo) || 20));
    const progressoGrupo = Math.min(
        Math.max(0, Math.floor(parseApiNumber(data?.progressoGrupo ?? data?.progresso_grupo))),
        metaGrupo,
    );
    const rawNotifications = data?.notificacoes ?? data?.ultimosEventos ?? [];

    return {
        girosTotaisObtidos: Math.max(0, parseApiNumber(
            data?.girosTotaisObtidos ?? data?.giros_totais_obtidos,
        )),
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

export function RoletaVipScreen() {
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const isAuthenticated = isCookieAuthMode ? Boolean(user) : Boolean(token && user);
    const [roleta, setRoleta] = useState<RoletaViewState>(emptyRoletaState);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const progressPercent = useMemo(() => (
        roleta.metaGrupo > 0 ? (roleta.progressoGrupo / roleta.metaGrupo) * 100 : 0
    ), [roleta.metaGrupo, roleta.progressoGrupo]);

    const authRefreshKey = isAuthenticated
        ? String(user?.id ?? user?.telefone ?? user?.phone ?? token ?? 'cookie-session')
        : 'guest';

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
                            <span>(resgate mínimo de R$5,00)</span>
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
                            {roleta.metaGrupo} ações -&gt; + {roleta.girosBonusGrupo} giros pra todos.
                        </p>
                    </section>

                    {error && (
                        <p className="roleta-vip-inline-error" role="alert">
                            {error}
                        </p>
                    )}
                </section>
            </main>
        </div>
    );
}
