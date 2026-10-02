import { useCallback, useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import { RoletaNotificationsStory } from '../roleta/RoletaNotificationsStory';
import { useAuthStore, type AuthUser } from '../../store/useAuthStore';
import { api, isCookieAuthMode } from '../../utils/api';
import { apiRoutes } from '../../utils/apiRoutes';
import {
    clearPendingIndicationCode,
    getPendingIndicationCode,
} from '../../utils/indicacaoReferral';
import {
    normalizeRoletaNotifications,
    type RoletaNotificacaoApi,
    type RoletaNotificationView,
} from '../../utils/roletaNotifications';
import { BrechoDaCamiLogo } from './BrechoDaCamiLogo';
import './LoginModal.css';

type LoginStep = 'choice' | 'details' | 'otp';
type AccessMode = 'first' | 'login';

interface LoginModalProps {
    roletaBackdrop?: boolean;
    initialStep?: LoginStep;
    onFirstAccessAsGuest?: () => void;
}

interface VerifyOtpResponse {
    token?: string;
    accessToken?: string;
    usuario?: {
        id?: string;
        name?: string | null;
        nome?: string | null;
        phone?: string | null;
        telefone?: string | null;
    };
    user?: {
        id?: string;
        name?: string | null;
        nome?: string | null;
        phone?: string | null;
        telefone?: string | null;
    };
}

interface RequestOtpResponse {
    status?: string;
    message?: string;
}

interface RequestOtpPayload {
    telefone: string;
    codigoIndicacao?: string;
}

interface VerifyOtpPayload {
    telefone: string;
    codigo: string;
}

interface AuthMeResponse {
    usuario?: VerifyOtpResponse['usuario'];
    user?: VerifyOtpResponse['user'];
}

type NumericApiValue = number | string | null | undefined;

interface RoletaMetaApi {
    titulo?: string | null;
    quantidadeAlvo?: NumericApiValue;
    quantidade_alvo?: NumericApiValue;
    progressoAtual?: NumericApiValue;
    progresso_atual?: NumericApiValue;
    girosRecompensa?: NumericApiValue;
    giros_recompensa?: NumericApiValue;
}

interface RoletaNotificationsResponse {
    notificacoes?: RoletaNotificacaoApi[] | null;
    ultimosEventos?: RoletaNotificacaoApi[] | null;
    metaAtual?: RoletaMetaApi | null;
    meta_atual?: RoletaMetaApi | null;
    metaGrupo?: NumericApiValue;
    meta_grupo?: NumericApiValue;
    progressoGrupo?: NumericApiValue;
    progresso_grupo?: NumericApiValue;
    girosBonusGrupo?: NumericApiValue;
    giros_bonus_grupo?: NumericApiValue;
}

interface LoginModalGroupGoal {
    hasMeta: boolean;
    title: string;
    current: number;
    target: number;
    reward: number;
}

function onlyDigits(value: string) {
    return value.replace(/\D/g, '');
}

function parseApiNumber(value: NumericApiValue) {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === 'string') {
        const parsedValue = Number(value.trim().replace(',', '.'));
        return Number.isFinite(parsedValue) ? parsedValue : 0;
    }

    return 0;
}

function normalizeLoginModalGroupGoal(data: RoletaNotificationsResponse): LoginModalGroupGoal {
    const metaAtual = data.metaAtual ?? data.meta_atual;

    if (!metaAtual) {
        return {
            hasMeta: false,
            title: 'Meta atual do grupo',
            current: 0,
            target: 0,
            reward: 0,
        };
    }

    const target = Math.floor(parseApiNumber(metaAtual.quantidadeAlvo ?? metaAtual.quantidade_alvo));
    const current = Math.floor(parseApiNumber(metaAtual.progressoAtual ?? metaAtual.progresso_atual));

    return {
        hasMeta: target > 0,
        title: metaAtual.titulo?.trim() || 'Meta atual do grupo',
        current: Math.min(Math.max(current, 0), Math.max(target, 0)),
        target,
        reward: Math.floor(parseApiNumber(metaAtual.girosRecompensa ?? metaAtual.giros_recompensa)),
    };
}

function formatPhone(value: string) {
    const digits = onlyDigits(value).slice(0, 11);

    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }

    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function getErrorMessage(error: unknown, fallback: string) {
    if (!axios.isAxiosError(error)) return fallback;

    const apiMessage = error.response?.data as { message?: string; error?: string } | undefined;
    return apiMessage?.message ?? apiMessage?.error ?? fallback;
}

function isDuplicatePhoneError(error: unknown) {
    if (!axios.isAxiosError(error)) return false;

    const responseData = error.response?.data as {
        message?: string;
        error?: string;
        code?: string;
    } | string | undefined;
    const rawMessage = typeof responseData === 'string'
        ? responseData
        : [responseData?.message, responseData?.error, responseData?.code]
            .filter(Boolean)
            .join(' ');
    const normalizedMessage = rawMessage
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    return error.response?.status === 409
        || normalizedMessage.includes('cadastr')
        || normalizedMessage.includes('duplic')
        || normalizedMessage.includes('exist')
        || normalizedMessage.includes('ja possui');
}

function isDuplicatePhoneResponse(response?: RequestOtpResponse) {
    const normalizedStatus = `${response?.status ?? ''} ${response?.message ?? ''}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    return normalizedStatus.includes('existing_user')
        || normalizedStatus.includes('usuario_ja_cadastrado')
        || normalizedStatus.includes('ja cadastrado')
        || normalizedStatus.includes('cadastr');
}

export function LoginModal({
    roletaBackdrop = false,
    initialStep = 'choice',
    onFirstAccessAsGuest,
}: LoginModalProps) {
    const setSession = useAuthStore((state) => state.setSession);
    const [step, setStep] = useState<LoginStep>(initialStep);
    const [accessMode, setAccessMode] = useState<AccessMode>('login');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [notifications, setNotifications] = useState<RoletaNotificationView[]>([]);
    const [groupGoal, setGroupGoal] = useState<LoginModalGroupGoal>({
        hasMeta: false,
        title: 'Meta atual do grupo',
        current: 0,
        target: 0,
        reward: 0,
    });

    const phoneDigits = onlyDigits(phone);
    const isPhoneValid = phoneDigits.length >= 10;
    const hasNotifications = notifications.length > 0;
    const groupGoalProgress = groupGoal.hasMeta
        ? Math.min(100, Math.max(0, (groupGoal.current / groupGoal.target) * 100))
        : 0;
    const phoneStepTitle = accessMode === 'first'
        ? 'Digite seu Whatsapp'
        : 'Bem-vindo(a) de volta';

    const startAuthFlow = (mode: AccessMode) => {
        setAccessMode(mode);
        setError('');
        setNotice('');
        setStep('details');
    };

    const continueAsGuestFirstAccess = () => {
        onFirstAccessAsGuest?.();
    };

    const fetchNotifications = useCallback(async () => {
        try {
            const { data } = await api.get<RoletaNotificationsResponse>(apiRoutes.roleta.status);
            setNotifications(normalizeRoletaNotifications(data.notificacoes ?? data.ultimosEventos ?? []));
            setGroupGoal(normalizeLoginModalGroupGoal(data));
        } catch {
            setNotifications([]);
            setGroupGoal({
                hasMeta: false,
                title: 'Meta atual do grupo',
                current: 0,
                target: 0,
                reward: 0,
            });
        }
    }, []);

    useEffect(() => {
        void fetchNotifications();
    }, [fetchNotifications]);

    const requestOtp = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (phoneDigits.length < 10) {
            setError('Digite um WhatsApp com DDD.');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const pendingIndicationCode = getPendingIndicationCode();
            const payload: RequestOtpPayload = {
                telefone: phoneDigits,
            };

            if (pendingIndicationCode) {
                payload.codigoIndicacao = pendingIndicationCode;
            }

            const { data } = await api.post<RequestOtpResponse>(apiRoutes.auth.requestOtp, payload);

            if (accessMode === 'first' && isDuplicatePhoneResponse(data)) {
                setNotice('Já possui este número em nosso cadastro iremos enviar o código para fazer o login normalmente.');
            }

            setOtp('');
            setStep('otp');
        } catch (requestError) {
            if (accessMode === 'first' && isDuplicatePhoneError(requestError)) {
                setNotice('Já possui este número em nosso cadastro iremos enviar o código para fazer o login normalmente.');
                setOtp('');
                setStep('otp');
                return;
            }

            setError(getErrorMessage(
                requestError,
                'Não conseguimos enviar o código agora. Tente novamente.',
            ));
        } finally {
            setIsLoading(false);
        }
    };

    const verifyOtp = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (otp.length !== 6) {
            setError('Digite o código de 6 dígitos.');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const payload: VerifyOtpPayload = {
                telefone: phoneDigits,
                codigo: otp,
            };

            const { data } = await api.post<VerifyOtpResponse>(apiRoutes.auth.verifyOtp, payload);
            const token = data.token ?? data.accessToken ?? null;

            if (!token && !isCookieAuthMode) {
                throw new Error('A resposta de autenticação não contém token.');
            }

            let apiUser = data.usuario ?? data.user;
            if (!apiUser && isCookieAuthMode) {
                const { data: meData } = await api.get<AuthMeResponse>(apiRoutes.auth.me);
                apiUser = meData.usuario ?? meData.user;
            }

            const userName = apiUser?.nome ?? apiUser?.name ?? '';
            const userPhone = apiUser?.telefone ?? apiUser?.phone ?? phoneDigits;
            const user: AuthUser = {
                ...(apiUser ?? {}),
                name: userName,
                nome: userName,
                phone: userPhone,
                telefone: userPhone,
            };

            setSession(token, user);
            clearPendingIndicationCode();
        } catch (verificationError) {
            setError(getErrorMessage(
                verificationError,
                'Código inválido ou expirado. Confira e tente novamente.',
            ));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className={`login-modal__overlay${roletaBackdrop ? ' login-modal__overlay--roleta' : ''} fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-modal-title"
        >
            <div className="login-modal__card bg-white rounded-[28px] shadow-2xl p-6">
                {step === 'choice' && (
                    <>
                        <h1 id="login-modal-title" className="login-modal__brand">
                            <BrechoDaCamiLogo className="login-modal__brand-logo" />
                        </h1>

                        {hasNotifications && (
                            <RoletaNotificationsStory
                                notifications={notifications}
                                className={`login-modal__notifications${groupGoal.hasMeta ? ' login-modal__notifications--with-goal' : ''}`}
                                ariaLabel="Notificacoes da roleta no login"
                            />
                        )}

                        {groupGoal.hasMeta && (
                            <section className="login-modal__goal" aria-label="Meta atual do grupo">
                                <div className="login-modal__goal-row">
                                    <span>{groupGoal.title}</span>
                                    <strong>{groupGoal.current}/{groupGoal.target}</strong>
                                </div>
                                <div className="login-modal__goal-track" aria-hidden="true">
                                    <span
                                        className="login-modal__goal-fill"
                                        style={{ width: `${groupGoalProgress}%` }}
                                    />
                                </div>
                            </section>
                        )}

                        <div className={`login-modal__actions${hasNotifications || groupGoal.hasMeta ? ' login-modal__actions--after-notifications' : ''} flex flex-col gap-3 mt-6`}>
                            <button
                                className="login-modal__primary"
                                type="button"
                                onClick={continueAsGuestFirstAccess}
                            >
                                Primeiro Acesso
                            </button>
                            <button
                                className="login-modal__secondary"
                                type="button"
                                onClick={() => startAuthFlow('login')}
                            >
                                Acessar perfil
                            </button>
                        </div>
                    </>
                )}

                {step === 'details' && (
                    <form className="login-modal__form" onSubmit={requestOtp} noValidate>
                        <h1 id="login-modal-title" className="login-modal__brand">
                            <BrechoDaCamiLogo className="login-modal__brand-logo" />
                        </h1>
                        <label className="login-modal__label" htmlFor="login-phone">
                            {phoneStepTitle}
                        </label>
                        <input
                            id="login-phone"
                            className="login-modal__input"
                            value={phone}
                            onChange={(event) => {
                                setPhone(formatPhone(event.target.value));
                                setError('');
                                setNotice('');
                            }}
                            placeholder="(11) 99999-9999"
                            inputMode="tel"
                            autoComplete="tel"
                        />
                        {error && <p className="login-modal__error" role="alert">{error}</p>}
                        <button
                            className={`login-modal__primary${!isPhoneValid ? ' login-modal__primary--inactive' : ''}`}
                            type="submit"
                            disabled={isLoading || !isPhoneValid}
                        >
                            Acessar perfil
                        </button>
                    </form>
                )}

                {step === 'otp' && (
                    <form className="login-modal__form" onSubmit={verifyOtp} noValidate>
                        <h1 id="login-modal-title" className="login-modal__brand">
                            <BrechoDaCamiLogo className="login-modal__brand-logo" />
                        </h1>
                        {notice && <p className="login-modal__notice" role="status">{notice}</p>}
                        <label className="login-modal__label" htmlFor="login-otp">
                            Código de 6 dígitos
                        </label>
                        <input
                            id="login-otp"
                            className="login-modal__input login-modal__input--otp"
                            value={otp}
                            onChange={(event) => {
                                setOtp(onlyDigits(event.target.value).slice(0, 6));
                                setError('');
                            }}
                            placeholder="000000"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                        />
                        {error && <p className="login-modal__error" role="alert">{error}</p>}
                        <button
                            className="login-modal__primary"
                            type="submit"
                            disabled={isLoading}
                        >
                            Acessar Perfil
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
