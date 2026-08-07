import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Copy, Gift, Lock, RefreshCcw } from 'lucide-react';
import { BrechoDaCamiLogo } from '../components/common/BrechoDaCamiLogo';
import { type AuthUser, useAuthStore } from '../store/useAuthStore';
import { useConfiguracoesStore } from '../store/useConfiguracoesStore';
import { api, isCookieAuthMode } from '../utils/api';
import { apiRoutes } from '../utils/apiRoutes';
import { formatCondicao } from '../utils/condicao';
import { getImageUrl } from '../utils/imageUtils';
import './RoletaVipScreen.css';

type RoletaTab = 'roleta' | 'produtos';

interface RoletaPremio {
    id?: number | string | null;
    valorDesconto?: number | string | null;
    valorFormatado?: string | null;
    status?: string | null;
    criadoEm?: string | null;
}

interface RoletaPremioFaixa {
    minimo?: number | string | null;
    maximo?: number | string | null;
    label?: string | null;
}

interface RoletaStatus {
    ativa?: boolean | null;
    titulo?: string | null;
    metaGrupo?: number | null;
    progressoGrupo?: number | null;
    girosBonusGrupo?: number | null;
    girosDisponiveis?: number | null;
    giroDiarioDisponivel?: boolean | null;
    proximoGiroDiarioEm?: string | null;
    premioPendente?: RoletaPremio | null;
    ultimosEventos?: string[] | null;
    premiosEmJogo?: RoletaPremioFaixa[] | null;
}

interface RoletaGiroResponse {
    premio?: RoletaPremio | null;
    roleta?: RoletaStatus | null;
}

interface RoletaConvitesResponse {
    codigoConvite?: string | null;
    urlConvite?: string | null;
    quantidadeConvertida?: number | null;
    girosGanhosPorConvite?: number | null;
}

interface ProdutoApi {
    id: number | string;
    nome: string;
    precoVenda: number | string;
    precoAntigo?: number | string | null;
    condicao?: number | string | null;
    condicaoRoupa?: number | string | null;
    condicao_roupa?: number | string | null;
    tamanho?: string | null;
    imagemUrl?: string | null;
    imagens?: ProdutoImagemApi[] | null;
}

type ProdutoImagemApi = string | {
    id?: number | string | null;
    url?: string | null;
    imagemUrl?: string | null;
    caminho?: string | null;
    path?: string | null;
    principal?: boolean | string | number | null;
    ordem?: number | string | null;
};

interface ProdutosPage {
    content?: ProdutoApi[];
}

function parsePrice(value?: number | string | null) {
    if (typeof value === 'number') return value;
    if (!value) return 0;

    const normalizedValue = value
        .replace(/[^\d,.-]/g, '')
        .replace(/\.(?=\d{3}(?:\D|$))/g, '')
        .replace(',', '.');

    return Number(normalizedValue) || 0;
}

function formatPrice(value?: number | string | null) {
    return parsePrice(value).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

function getErrorMessage(error: unknown, fallback: string) {
    if (!axios.isAxiosError(error)) return fallback;

    const responseData = error.response?.data as {
        message?: string;
        error?: string;
    } | undefined;

    return responseData?.message ?? responseData?.error ?? fallback;
}

function getProdutoImagePath(image: ProdutoImagemApi) {
    if (typeof image === 'string') return image;
    return image.url ?? image.imagemUrl ?? image.caminho ?? image.path ?? '';
}

function isPrincipalImage(value: unknown) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
    return false;
}

function getProdutoMainImage(produto: ProdutoApi) {
    const orderedImages = (produto.imagens ?? [])
        .map((image, index) => ({
            path: getProdutoImagePath(image),
            principal: typeof image === 'object' && image !== null
                ? isPrincipalImage(image.principal)
                : false,
            ordem: typeof image === 'object' && image !== null
                ? Number(image.ordem ?? index)
                : index,
        }))
        .filter((image) => image.path.trim())
        .sort((a, b) => {
            if (a.principal !== b.principal) return a.principal ? -1 : 1;
            return a.ordem - b.ordem;
        });

    return getImageUrl(orderedImages[0]?.path ?? produto.imagemUrl);
}

function normalizeStatus(data?: RoletaStatus | null): RoletaStatus {
    return {
        ativa: data?.ativa ?? false,
        titulo: data?.titulo ?? 'Brecho da Cami',
        metaGrupo: Math.max(1, data?.metaGrupo ?? 20),
        progressoGrupo: Math.max(0, data?.progressoGrupo ?? 0),
        girosBonusGrupo: Math.max(0, data?.girosBonusGrupo ?? 0),
        girosDisponiveis: data?.girosDisponiveis ?? null,
        giroDiarioDisponivel: Boolean(data?.giroDiarioDisponivel),
        proximoGiroDiarioEm: data?.proximoGiroDiarioEm ?? null,
        premioPendente: data?.premioPendente ?? null,
        ultimosEventos: data?.ultimosEventos ?? [],
        premiosEmJogo: data?.premiosEmJogo ?? [],
    };
}

function getDisplayName(user: AuthUser | null) {
    const nome = typeof user?.nome === 'string' ? user.nome.trim() : '';
    const name = typeof user?.name === 'string' ? user.name.trim() : '';
    return nome || name || 'membro';
}

export function RoletaVipScreen() {
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const condicaoCasasDecimais = useConfiguracoesStore((state) => state.condicaoCasasDecimais);
    const isAuthenticated = isCookieAuthMode ? Boolean(user) : Boolean(token && user);
    const [status, setStatus] = useState<RoletaStatus | null>(null);
    const [produtos, setProdutos] = useState<ProdutoApi[]>([]);
    const [convites, setConvites] = useState<RoletaConvitesResponse | null>(null);
    const [activeTab, setActiveTab] = useState<RoletaTab>('roleta');
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [isSpinning, setIsSpinning] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [wheelRotation, setWheelRotation] = useState(0);
    const [lastPrize, setLastPrize] = useState<RoletaPremio | null>(null);

    const normalizedStatus = useMemo(() => normalizeStatus(status), [status]);
    const metaGrupo = normalizedStatus.metaGrupo ?? 20;
    const progressoGrupo = Math.min(normalizedStatus.progressoGrupo ?? 0, metaGrupo);
    const progressPercent = metaGrupo > 0 ? (progressoGrupo / metaGrupo) * 100 : 0;
    const girosDisponiveis = normalizedStatus.girosDisponiveis ?? 0;
    const activePrize = lastPrize ?? normalizedStatus.premioPendente;

    const fetchStatus = useCallback(async () => {
        setIsLoadingStatus(true);
        setError('');

        try {
            const { data } = await api.get<RoletaStatus>(apiRoutes.roleta.status);
            setStatus(normalizeStatus(data));
        } catch (statusError) {
            setError(getErrorMessage(statusError, 'Nao foi possivel carregar a roleta agora.'));
        } finally {
            setIsLoadingStatus(false);
        }
    }, []);

    const fetchProtectedData = useCallback(async () => {
        if (!isAuthenticated) {
            setProdutos([]);
            setConvites(null);
            return;
        }

        setIsLoadingProducts(true);

        try {
            const [{ data: produtosData }, { data: convitesData }] = await Promise.all([
                api.get<ProdutoApi[] | ProdutosPage>(apiRoutes.roleta.produtos),
                api.get<RoletaConvitesResponse>(apiRoutes.roleta.convites),
            ]);
            setProdutos(Array.isArray(produtosData) ? produtosData : produtosData.content ?? []);
            setConvites(convitesData);
        } catch (protectedError) {
            setError(getErrorMessage(
                protectedError,
                'Entre novamente para carregar os itens e convites da roleta.',
            ));
        } finally {
            setIsLoadingProducts(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        void fetchStatus();
    }, [fetchStatus]);

    useEffect(() => {
        void fetchProtectedData();
    }, [fetchProtectedData]);

    const spinWheel = async () => {
        if (!isAuthenticated) {
            setError('Entre com seu WhatsApp para girar a roleta.');
            return;
        }

        if (!normalizedStatus.ativa) {
            setError('A roleta esta inativa no momento.');
            return;
        }

        setIsSpinning(true);
        setError('');

        try {
            const { data } = await api.post<RoletaGiroResponse>(apiRoutes.roleta.girar);
            const premio = data.premio ?? null;
            setLastPrize(premio);
            setStatus(normalizeStatus(data.roleta));
            setWheelRotation((currentRotation) => (
                currentRotation + 1440 + Math.floor(Math.random() * 360)
            ));
            await fetchProtectedData();
        } catch (spinError) {
            setError(getErrorMessage(spinError, 'Nao foi possivel girar a roleta agora.'));
        } finally {
            window.setTimeout(() => setIsSpinning(false), 900);
        }
    };

    const copyInvite = async () => {
        if (!convites?.urlConvite) return;

        try {
            await navigator.clipboard.writeText(convites.urlConvite);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1400);
        } catch {
            setError('Nao foi possivel copiar o link automaticamente.');
        }
    };

    return (
        <div className="roleta-vip-page">
            <main className="roleta-vip-shell" aria-busy={isLoadingStatus}>
                <h1 className="roleta-vip-title">
                    <BrechoDaCamiLogo className="roleta-vip-logo" />
                </h1>

                <section className="roleta-vip-goal-card">
                    <div className="roleta-vip-goal-row">
                        <span>meta do grupo</span>
                        <strong>{progressoGrupo}/{metaGrupo}</strong>
                    </div>
                    <div className="roleta-vip-progress">
                        <span style={{ width: `${progressPercent}%` }} />
                    </div>
                    <div className="roleta-vip-goal-subtitle">
                        a cada {metaGrupo} acoes {'->'} +{normalizedStatus.girosBonusGrupo} giros pra todo mundo
                        <span>bonus: {normalizedStatus.girosBonusGrupo}</span>
                    </div>
                    <div className="roleta-vip-event">
                        {normalizedStatus.ultimosEventos?.[0] ?? 'Nenhum giro registrado ainda.'}
                    </div>
                </section>

                <div className="roleta-vip-tabs" role="tablist" aria-label="Roleta VIP">
                    <button
                        type="button"
                        className={activeTab === 'roleta' ? 'is-active' : ''}
                        onClick={() => setActiveTab('roleta')}
                    >
                        Roleta
                    </button>
                    <button
                        type="button"
                        className={activeTab === 'produtos' ? 'is-active' : ''}
                        onClick={() => setActiveTab('produtos')}
                    >
                        Itens diarios
                    </button>
                </div>

                {error && (
                    <div className="roleta-vip-alert" role="alert">
                        {error}
                    </div>
                )}

                {activeTab === 'roleta' ? (
                    <section className="roleta-vip-spin-panel">
                        <div className="roleta-vip-pointer" aria-hidden="true" />
                        <motion.div
                            className="roleta-vip-wheel"
                            animate={{ rotate: wheelRotation }}
                            transition={{ duration: 1.25, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <button
                                type="button"
                                className="roleta-vip-wheel-button"
                                onClick={() => void spinWheel()}
                                disabled={isSpinning || isLoadingStatus || !normalizedStatus.ativa}
                            >
                                girar
                            </button>
                        </motion.div>

                        <p className="roleta-vip-spins">
                            voce tem <strong>{girosDisponiveis}</strong> giro(s)
                        </p>

                        <button
                            type="button"
                            className="roleta-vip-primary"
                            onClick={() => void spinWheel()}
                            disabled={isSpinning || isLoadingStatus || !normalizedStatus.ativa}
                        >
                            {isSpinning ? 'Girando...' : 'Girar a roleta'}
                        </button>

                        <section className="roleta-vip-soft-card">
                            <strong>GIRO DIARIO</strong>
                            <span>
                                {normalizedStatus.giroDiarioDisponivel
                                    ? 'disponivel agora'
                                    : normalizedStatus.proximoGiroDiarioEm
                                        ? `libera em ${new Date(normalizedStatus.proximoGiroDiarioEm).toLocaleDateString('pt-BR')}`
                                        : 'libera quando zerar as chances'}
                            </span>
                        </section>

                        <section className="roleta-vip-prize-card">
                            <strong>
                                {activePrize?.valorFormatado ?? 'Sem premio pendente'}
                            </strong>
                            <span>Decide abaixo: usar ou jogar fora.</span>
                        </section>

                        <section className="roleta-vip-prizes">
                            <h2>PREMIOS EM JOGO</h2>
                            {normalizedStatus.premiosEmJogo?.length ? (
                                <div className="roleta-vip-prize-list">
                                    {normalizedStatus.premiosEmJogo.map((premio, index) => (
                                        <span key={`${premio.label}-${index}`}>
                                            {premio.label}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p>Nenhum premio configurado.</p>
                            )}
                        </section>

                        <section className="roleta-vip-invite-card">
                            <h2>Quanto mais gente, mais giro</h2>
                            <ol>
                                <li>Copia seu link abaixo.</li>
                                <li>Manda pra quem voce quiser no grupo.</li>
                                <li>Quando a pessoa entrar logada pelo seu link, voce ganha giros extras.</li>
                            </ol>

                            <div className="roleta-vip-invite-count">
                                <span>pessoas que entraram pelo seu link</span>
                                <strong>{convites?.quantidadeConvertida ?? 0}</strong>
                            </div>
                            <div className="roleta-vip-copy-row">
                                <input
                                    value={convites?.urlConvite ?? ''}
                                    readOnly
                                    placeholder={isAuthenticated ? 'Carregando link...' : 'Entre para gerar seu link'}
                                    aria-label="Link de convite da roleta"
                                />
                                <button type="button" onClick={() => void copyInvite()}>
                                    <Copy size={14} />
                                    {copied ? 'copiado' : 'copiar'}
                                </button>
                            </div>
                        </section>
                    </section>
                ) : (
                    <section className="roleta-vip-products-panel">
                        {isLoadingProducts ? (
                            <div className="roleta-vip-empty">
                                <RefreshCcw size={18} />
                                Carregando itens da roleta...
                            </div>
                        ) : produtos.length === 0 ? (
                            <div className="roleta-vip-empty">
                                <Lock size={18} />
                                Nenhum item disponivel na roleta hoje.
                            </div>
                        ) : (
                            <div className="roleta-vip-product-grid">
                                {produtos.map((produto) => (
                                    <article className="roleta-vip-product-card" key={produto.id}>
                                        <img src={getProdutoMainImage(produto)} alt={produto.nome} />
                                        <div>
                                            <strong>{produto.nome}</strong>
                                            <span>Tam. {produto.tamanho || 'Unico'}</span>
                                            {formatCondicao(
                                                produto.condicao ?? produto.condicaoRoupa ?? produto.condicao_roupa,
                                                condicaoCasasDecimais,
                                            ) && (
                                                <span>
                                                    Cond. {formatCondicao(
                                                        produto.condicao ?? produto.condicaoRoupa ?? produto.condicao_roupa,
                                                        condicaoCasasDecimais,
                                                    )}
                                                </span>
                                            )}
                                            <b>{formatPrice(produto.precoVenda)}</b>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                <footer className="roleta-vip-footer">
                    <Gift size={14} />
                    {isAuthenticated
                        ? `${getDisplayName(user)}, seus descontos valem por item escolhido nos Itens diarios.`
                        : 'Entre com WhatsApp para participar da roleta VIP.'}
                </footer>
            </main>
        </div>
    );
}
