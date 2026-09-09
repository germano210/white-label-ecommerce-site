import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { AppIcon } from '../icons/AppIcon';
import { useAuthStore, type AuthUser } from '../../store/useAuthStore';
import { api } from '../../utils/api';
import { apiRoutes } from '../../utils/apiRoutes';
import { getImageUrl } from '../../utils/imageUtils';
import { normalizeIndicationLink, type IndicacaoLinkApiLike } from '../../utils/indicacaoReferral';
import './RoletaProfileModal.css';

type NumericApiValue = number | string | null | undefined;

interface EnderecoApi {
    rua?: string | null;
    numero?: string | null;
    complemento?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    estado?: string | null;
    cep?: string | null;
}

interface UsuarioPerfilApi {
    id?: string | number | null;
    nome?: string | null;
    name?: string | null;
    telefone?: string | null;
    phone?: string | null;
    level?: NumericApiValue;
    nivel?: NumericApiValue;
    xpAtual?: NumericApiValue;
    xp_atual?: NumericApiValue;
    xpParaProximoNivel?: NumericApiValue;
    xp_para_proximo_nivel?: NumericApiValue;
    endereco?: EnderecoApi | null;
}

interface UsuarioMeResponse extends UsuarioPerfilApi {
    usuario?: UsuarioPerfilApi | null;
    user?: UsuarioPerfilApi | null;
}

interface ResgateProdutoApi {
    nome?: string | null;
    titulo?: string | null;
    tamanho?: string | null;
    imagemUrl?: string | null;
    imagem_url?: string | null;
    precoVenda?: NumericApiValue;
    preco_venda?: NumericApiValue;
}

interface ResgateApi {
    id?: string | number | null;
    nome?: string | null;
    nomeProduto?: string | null;
    nome_produto?: string | null;
    produtoNome?: string | null;
    produto_nome?: string | null;
    tamanho?: string | null;
    imagemUrl?: string | null;
    imagem_url?: string | null;
    valorPago?: NumericApiValue;
    valor_pago?: NumericApiValue;
    valorFinal?: NumericApiValue;
    valor_final?: NumericApiValue;
    precoPago?: NumericApiValue;
    preco_pago?: NumericApiValue;
    status?: string | null;
    situacao?: string | null;
    produto?: ResgateProdutoApi | null;
    product?: ResgateProdutoApi | null;
    item?: ResgateProdutoApi | null;
}

type ResgatesResponse = ResgateApi[] | {
    content?: ResgateApi[];
    data?: ResgateApi[];
    itens?: ResgateApi[];
    items?: ResgateApi[];
    resgates?: ResgateApi[];
};

interface IndicacaoLinkResponse extends IndicacaoLinkApiLike {
    urlConvite?: string | null;
    url_convite?: string | null;
    linkConvite?: string | null;
    link_convite?: string | null;
    urlIndicacao?: string | null;
    url_indicacao?: string | null;
    linkIndicacao?: string | null;
    link_indicacao?: string | null;
    url?: string | null;
    link?: string | null;
}

interface ProfileAddress {
    rua: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
}

interface ProfileView {
    id: string;
    nome: string;
    telefone: string;
    level: number;
    xpAtual: number;
    xpParaProximoNivel: number;
    endereco: ProfileAddress;
}

interface ResgateView {
    id: string;
    nome: string;
    tamanho: string;
    imagemUrl: string;
    valorPago: number;
    status: string;
}

interface RoletaProfileModalProps {
    valorDisponivelResgate: number;
    onClose: () => void;
}

const emptyAddress: ProfileAddress = {
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
};

function parseApiNumber(value: unknown) {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === 'string') {
        const parsedValue = Number(value.trim().replace(',', '.'));
        return Number.isFinite(parsedValue) ? parsedValue : 0;
    }

    return 0;
}

function stringFromUnknown(...values: unknown[]) {
    for (const value of values) {
        if (typeof value === 'string' && value.trim()) return value.trim();
        if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    }

    return '';
}

function formatCurrencyBRL(value: number) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Math.max(0, value)).replace(/\s/g, '');
}

function normalizeAddress(address?: EnderecoApi | null): ProfileAddress {
    return {
        rua: stringFromUnknown(address?.rua),
        numero: stringFromUnknown(address?.numero),
        complemento: stringFromUnknown(address?.complemento),
        bairro: stringFromUnknown(address?.bairro),
        cidade: stringFromUnknown(address?.cidade),
        estado: stringFromUnknown(address?.estado),
        cep: stringFromUnknown(address?.cep),
    };
}

function getUsuarioPayload(data: UsuarioMeResponse) {
    return data.usuario ?? data.user ?? data;
}

function normalizeProfile(data: UsuarioPerfilApi, fallbackUser: AuthUser | null): ProfileView {
    const level = Math.max(1, Math.floor(parseApiNumber(
        data.level ?? data.nivel ?? fallbackUser?.level ?? fallbackUser?.nivel,
    )));
    const xpParaProximoNivel = Math.max(0, parseApiNumber(
        data.xpParaProximoNivel
        ?? data.xp_para_proximo_nivel
        ?? fallbackUser?.xpParaProximoNivel
        ?? fallbackUser?.xp_para_proximo_nivel,
    ));

    return {
        id: stringFromUnknown(data.id, fallbackUser?.id),
        nome: stringFromUnknown(data.nome, data.name, fallbackUser?.nome, fallbackUser?.name, 'Cliente'),
        telefone: stringFromUnknown(data.telefone, data.phone, fallbackUser?.telefone, fallbackUser?.phone),
        level,
        xpAtual: Math.max(0, parseApiNumber(data.xpAtual ?? data.xp_atual ?? fallbackUser?.xpAtual ?? fallbackUser?.xp_atual)),
        xpParaProximoNivel,
        endereco: normalizeAddress(data.endereco),
    };
}

function getResgateProduto(resgate: ResgateApi) {
    return resgate.produto ?? resgate.product ?? resgate.item ?? null;
}

function normalizeResgate(resgate: ResgateApi, index: number): ResgateView {
    const produto = getResgateProduto(resgate);
    const valorPago = parseApiNumber(
        resgate.valorPago
        ?? resgate.valor_pago
        ?? resgate.valorFinal
        ?? resgate.valor_final
        ?? resgate.precoPago
        ?? resgate.preco_pago
        ?? produto?.precoVenda
        ?? produto?.preco_venda,
    );

    return {
        id: stringFromUnknown(resgate.id, index),
        nome: stringFromUnknown(
            resgate.nome,
            resgate.nomeProduto,
            resgate.nome_produto,
            resgate.produtoNome,
            resgate.produto_nome,
            produto?.nome,
            produto?.titulo,
            'Item resgatado',
        ),
        tamanho: stringFromUnknown(resgate.tamanho, produto?.tamanho),
        imagemUrl: getImageUrl(stringFromUnknown(resgate.imagemUrl, resgate.imagem_url, produto?.imagemUrl, produto?.imagem_url)),
        valorPago,
        status: stringFromUnknown(resgate.status, resgate.situacao, 'PENDENTE').toUpperCase(),
    };
}

function normalizeResgatesResponse(data: ResgatesResponse) {
    const resgates = Array.isArray(data)
        ? data
        : data.resgates ?? data.itens ?? data.items ?? data.content ?? data.data ?? [];

    return resgates.map(normalizeResgate);
}

function addressToPayload(address: ProfileAddress): EnderecoApi {
    return {
        rua: address.rua.trim(),
        numero: address.numero.trim(),
        complemento: address.complemento.trim(),
        bairro: address.bairro.trim(),
        cidade: address.cidade.trim(),
        estado: address.estado.trim(),
        cep: address.cep.trim(),
    };
}

export function RoletaProfileModal({ valorDisponivelResgate, onClose }: RoletaProfileModalProps) {
    const user = useAuthStore((state) => state.user);
    const updateUser = useAuthStore((state) => state.updateUser);
    const logout = useAuthStore((state) => state.logout);
    const isAuthenticated = Boolean(user);
    const [profile, setProfile] = useState<ProfileView | null>(null);
    const [resgates, setResgates] = useState<ResgateView[]>([]);
    const [nameDraft, setNameDraft] = useState('');
    const [addressDraft, setAddressDraft] = useState<ProfileAddress>(emptyAddress);
    const [inviteUrl, setInviteUrl] = useState('');
    const [copyLabel, setCopyLabel] = useState('Copiar link');
    const [isLoading, setIsLoading] = useState(false);
    const [isInviteLoading, setIsInviteLoading] = useState(false);
    const [isSavingName, setIsSavingName] = useState(false);
    const [isSavingAddress, setIsSavingAddress] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [inviteError, setInviteError] = useState('');
    const [actionMessage, setActionMessage] = useState('');
    const [actionError, setActionError] = useState('');

    const xpProgressPercent = useMemo(() => {
        if (!profile?.xpParaProximoNivel) return 0;

        const progress = profile.xpAtual / profile.xpParaProximoNivel;
        return Math.min(Math.max(progress, 0), 1) * 100;
    }, [profile?.xpAtual, profile?.xpParaProximoNivel]);

    const fetchInviteLink = useCallback(async () => {
        if (!isAuthenticated) return;

        setIsInviteLoading(true);
        setInviteError('');

        try {
            const { data } = await api.get<IndicacaoLinkResponse>(apiRoutes.indicacoes.meuLink);
            let nextInviteUrl = normalizeIndicationLink(data);

            if (!nextInviteUrl) {
                const createdInvite = await api.post<IndicacaoLinkResponse>(apiRoutes.indicacoes.meuLink);
                nextInviteUrl = normalizeIndicationLink(createdInvite.data);
            }

            if (!nextInviteUrl) {
                throw new Error('Link de indicacao sem URL.');
            }

            setInviteUrl(nextInviteUrl);
        } catch {
            setInviteUrl('');
            setInviteError('Não foi possível carregar seu link.');
        } finally {
            setIsInviteLoading(false);
        }
    }, [isAuthenticated]);

    const fetchProfileData = useCallback(async () => {
        if (!isAuthenticated) {
            setIsLoading(false);
            setProfile(null);
            setResgates([]);
            return;
        }

        setIsLoading(true);
        setLoadError('');
        setActionError('');

        try {
            const [profileResponse, resgatesResponse] = await Promise.all([
                api.get<UsuarioMeResponse>(apiRoutes.usuarios.me),
                api.get<ResgatesResponse>(apiRoutes.usuarios.resgates),
            ]);
            const nextProfile = normalizeProfile(getUsuarioPayload(profileResponse.data), user);

            setProfile(nextProfile);
            setNameDraft(nextProfile.nome);
            setAddressDraft(nextProfile.endereco);
            setResgates(normalizeResgatesResponse(resgatesResponse.data));
            await fetchInviteLink();
        } catch {
            setLoadError('Não foi possível carregar seu perfil.');
        } finally {
            setIsLoading(false);
        }
    }, [fetchInviteLink, isAuthenticated, user]);

    useEffect(() => {
        void fetchProfileData();
    }, [fetchProfileData]);

    const handleAddressChange = (field: keyof ProfileAddress) => (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const { value } = event.target;
        setAddressDraft((currentAddress) => ({
            ...currentAddress,
            [field]: value,
        }));
    };

    const handleSaveName = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const nextName = nameDraft.trim();
        if (!nextName) {
            setActionError('Informe seu nome para salvar.');
            return;
        }

        setIsSavingName(true);
        setActionError('');
        setActionMessage('');

        try {
            const { data } = await api.put<UsuarioMeResponse>(apiRoutes.auth.updateName, { nome: nextName });
            const updatedUser = getUsuarioPayload(data);
            const savedName = stringFromUnknown(updatedUser.nome, updatedUser.name, nextName);
            const savedPhone = stringFromUnknown(updatedUser.telefone, updatedUser.phone, user?.telefone, user?.phone);
            const userPatch: Partial<AuthUser> = {
                name: savedName,
                nome: savedName,
            };

            if (savedPhone) {
                userPatch.phone = savedPhone;
                userPatch.telefone = savedPhone;
            }

            setProfile((currentProfile) => (
                currentProfile
                    ? { ...currentProfile, ...normalizeProfile({ ...updatedUser, nome: savedName }, user) }
                    : normalizeProfile({ ...updatedUser, nome: savedName }, user)
            ));
            setNameDraft(savedName);
            updateUser(userPatch);
            setActionMessage('Nome atualizado.');
        } catch {
            setActionError('Não foi possível salvar o nome.');
        } finally {
            setIsSavingName(false);
        }
    };

    const handleSaveAddress = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSavingAddress(true);
        setActionError('');
        setActionMessage('');

        try {
            const payload = addressToPayload(addressDraft);
            const { data } = await api.put<UsuarioMeResponse | EnderecoApi>(apiRoutes.usuarios.endereco, payload);
            const addressResponse = 'endereco' in data && data.endereco ? data.endereco : data as EnderecoApi;
            const nextAddress = normalizeAddress(addressResponse);

            setAddressDraft(nextAddress);
            setProfile((currentProfile) => (
                currentProfile ? { ...currentProfile, endereco: nextAddress } : currentProfile
            ));
            setActionMessage('Endereço atualizado.');
        } catch {
            setActionError('Não foi possível salvar o endereço.');
        } finally {
            setIsSavingAddress(false);
        }
    };

    const handleCopyInviteUrl = async () => {
        if (!inviteUrl || isInviteLoading) return;

        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopyLabel('Copiado');
            window.setTimeout(() => setCopyLabel('Copiar link'), 1600);
        } catch {
            setInviteError('Não foi possível copiar o link.');
        }
    };

    const handleLogout = () => {
        logout();
        onClose();
    };

    return (
        <div className="roleta-profile-modal" role="dialog" aria-modal="true" aria-label="Perfil">
            <button
                type="button"
                className="roleta-profile-modal__backdrop"
                onClick={onClose}
                aria-label="Fechar perfil"
            />

            <section className="roleta-profile-modal__sheet">
                <header className="roleta-profile-modal__header">
                    <div className="roleta-profile-modal__avatar" aria-hidden="true">
                        <AppIcon name="perfil" size={23} />
                    </div>
                    <button
                        type="button"
                        className="roleta-profile-modal__close"
                        onClick={onClose}
                        aria-label="Fechar perfil"
                    >
                        ×
                    </button>
                </header>

                {!isAuthenticated ? (
                    <div className="roleta-profile-modal__empty">
                        Entre para ver seu perfil.
                    </div>
                ) : (
                    <div className="roleta-profile-modal__content">
                        {isLoading && (
                            <div className="roleta-profile-modal__state">
                                Carregando perfil...
                            </div>
                        )}

                        {!isLoading && loadError && (
                            <div className="roleta-profile-modal__state" role="alert">
                                <span>{loadError}</span>
                                <button type="button" onClick={() => void fetchProfileData()}>
                                    Tentar novamente
                                </button>
                            </div>
                        )}

                        {!isLoading && !loadError && profile && (
                            <>
                                <section className="roleta-profile-modal__summary">
                                    <h2>{profile.nome || 'Cliente'}</h2>
                                    {profile.telefone && <p>{profile.telefone}</p>}
                                    <div className="roleta-profile-modal__level-row">
                                        <span>Lvl. {profile.level}</span>
                                        <span>Lvl. {profile.level + 1}</span>
                                    </div>
                                    <div className="roleta-profile-modal__xp-bar" aria-label="Progresso de XP">
                                        <span style={{ width: `${xpProgressPercent}%` }} />
                                    </div>
                                    <strong>{formatCurrencyBRL(valorDisponivelResgate)}</strong>
                                </section>

                                {(actionMessage || actionError) && (
                                    <p
                                        className={`roleta-profile-modal__feedback${actionError ? ' is-error' : ''}`}
                                        role={actionError ? 'alert' : 'status'}
                                    >
                                        {actionError || actionMessage}
                                    </p>
                                )}

                                <form className="roleta-profile-modal__section" onSubmit={handleSaveName}>
                                    <h3>Nome</h3>
                                    <label>
                                        <span>Nome</span>
                                        <input
                                            type="text"
                                            value={nameDraft}
                                            onChange={(event) => setNameDraft(event.target.value)}
                                            autoComplete="name"
                                        />
                                    </label>
                                    <button type="submit" disabled={isSavingName}>
                                        {isSavingName ? 'Salvando...' : 'Salvar nome'}
                                    </button>
                                </form>

                                <form className="roleta-profile-modal__section" onSubmit={handleSaveAddress}>
                                    <h3>Endereço</h3>
                                    <div className="roleta-profile-modal__address-grid">
                                        <label>
                                            <span>Rua</span>
                                            <input value={addressDraft.rua} onChange={handleAddressChange('rua')} />
                                        </label>
                                        <label>
                                            <span>Número</span>
                                            <input value={addressDraft.numero} onChange={handleAddressChange('numero')} />
                                        </label>
                                        <label>
                                            <span>Complemento</span>
                                            <input value={addressDraft.complemento} onChange={handleAddressChange('complemento')} />
                                        </label>
                                        <label>
                                            <span>Bairro</span>
                                            <input value={addressDraft.bairro} onChange={handleAddressChange('bairro')} />
                                        </label>
                                        <label>
                                            <span>Cidade</span>
                                            <input value={addressDraft.cidade} onChange={handleAddressChange('cidade')} />
                                        </label>
                                        <label>
                                            <span>Estado</span>
                                            <input value={addressDraft.estado} onChange={handleAddressChange('estado')} />
                                        </label>
                                        <label>
                                            <span>CEP</span>
                                            <input value={addressDraft.cep} onChange={handleAddressChange('cep')} inputMode="numeric" />
                                        </label>
                                    </div>
                                    <button type="submit" disabled={isSavingAddress}>
                                        {isSavingAddress ? 'Salvando...' : 'Salvar endereço'}
                                    </button>
                                </form>

                                <section className="roleta-profile-modal__section">
                                    <h3>Itens resgatados</h3>
                                    {resgates.length === 0 ? (
                                        <p className="roleta-profile-modal__muted">Nenhum item resgatado ainda.</p>
                                    ) : (
                                        <div className="roleta-profile-modal__resgates">
                                            {resgates.map((resgate) => (
                                                <article key={resgate.id} className="roleta-profile-modal__resgate-card">
                                                    <img src={resgate.imagemUrl} alt={resgate.nome} />
                                                    <div>
                                                        <strong>{resgate.nome}</strong>
                                                        {resgate.tamanho && <span>Tam. {resgate.tamanho}</span>}
                                                        <span>{formatCurrencyBRL(resgate.valorPago)}</span>
                                                        <small>{resgate.status}</small>
                                                    </div>
                                                </article>
                                            ))}
                                        </div>
                                    )}
                                </section>

                                <section className="roleta-profile-modal__section">
                                    <h3>Indique e ganhe</h3>
                                    <button
                                        type="button"
                                        className="roleta-profile-modal__primary-button"
                                        onClick={() => void fetchInviteLink()}
                                        disabled={isInviteLoading}
                                    >
                                        {isInviteLoading ? 'Carregando...' : 'Indique e ganhe'}
                                    </button>
                                    <div className="roleta-profile-modal__invite-row">
                                        <span>{isInviteLoading ? 'Carregando link...' : inviteUrl || 'Link indisponível.'}</span>
                                        <button type="button" onClick={() => void handleCopyInviteUrl()} disabled={!inviteUrl || isInviteLoading}>
                                            {copyLabel}
                                        </button>
                                    </div>
                                    {inviteError && (
                                        <p className="roleta-profile-modal__muted" role="alert">
                                            {inviteError}
                                        </p>
                                    )}
                                </section>

                                <button type="button" className="roleta-profile-modal__logout" onClick={handleLogout}>
                                    Sair
                                </button>
                            </>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}
