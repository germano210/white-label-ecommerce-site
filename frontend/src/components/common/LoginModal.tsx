import { useMemo, useState, type FormEvent } from 'react';
import axios from 'axios';
import { useAuthStore, type AuthUser } from '../../store/useAuthStore';
import { useDiscoveryStore } from '../../store/useDiscoveryStore';
import { api } from '../../utils/api';
import { apiRoutes } from '../../utils/apiRoutes';
import './LoginModal.css';

type LoginStep = 'choice' | 'details' | 'otp';
type AccessMode = 'first' | 'login';

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

const fallbackImages = [
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80',
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=500&q=80',
    'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500&q=80',
];

const purchaseNotifications = [
    'Fernanda resgatou 5 tentativas',
    'Manuela resgatou Jaqueta Ferrari',
    'Maria comprou há 2 min',
];

function onlyDigits(value: string) {
    return value.replace(/\D/g, '');
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

export function LoginModal() {
    const setSession = useAuthStore((state) => state.setSession);
    const products = useDiscoveryStore((state) => state.products);
    const [step, setStep] = useState<LoginStep>('choice');
    const [accessMode, setAccessMode] = useState<AccessMode>('login');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const phoneDigits = onlyDigits(phone);

    const galleryImages = useMemo(() => {
        const productImages = products
            .flatMap((product) => product.images ?? [])
            .filter(Boolean)
            .slice(0, 3);

        return [...productImages, ...fallbackImages].slice(0, 3);
    }, [products]);

    const startAuthFlow = (mode: AccessMode) => {
        setAccessMode(mode);
        setError('');
        setNotice('');
        setStep('details');
    };

    const requestOtp = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (phoneDigits.length < 10) {
            setError('Digite um WhatsApp com DDD.');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const { data } = await api.post<RequestOtpResponse>(apiRoutes.auth.requestOtp, {
                telefone: phoneDigits,
            });

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
            const { data } = await api.post<VerifyOtpResponse>(apiRoutes.auth.verifyOtp, {
                telefone: phoneDigits,
                codigo: otp,
            });
            const token = data.token ?? data.accessToken;

            if (!token) {
                throw new Error('A resposta de autenticação não contém token.');
            }

            const apiUser = data.usuario ?? data.user;
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
            className="login-modal__overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-modal-title"
        >
            <div className="login-modal__card bg-white rounded-[28px] shadow-2xl p-6">
                {step === 'choice' && (
                    <>
                        <div className="login-modal__proof">
                            {purchaseNotifications.map((notification) => (
                                <span key={notification} className="login-modal__notification">
                                    <span className="login-modal__bell" aria-hidden="true" />
                                    {notification}
                                </span>
                            ))}
                        </div>

                        <h1 id="login-modal-title" className="login-modal__brand">
                            Brechó da Cami
                        </h1>

                        <div className="login-modal__gallery grid grid-cols-3 gap-2">
                            {galleryImages.map((imageUrl, index) => (
                                <img
                                    key={`${imageUrl}-${index}`}
                                    src={imageUrl}
                                    alt=""
                                    aria-hidden="true"
                                    className="login-modal__thumb rounded-xl object-cover"
                                />
                            ))}
                        </div>

                        <div className="login-modal__actions flex flex-col gap-3 mt-6">
                            <button
                                className="login-modal__primary"
                                type="button"
                                onClick={() => startAuthFlow('first')}
                            >
                                Primeiro Acesso
                            </button>
                            <button
                                className="login-modal__secondary"
                                type="button"
                                onClick={() => startAuthFlow('login')}
                            >
                                Entrar na Minha Conta
                            </button>
                        </div>
                    </>
                )}

                {step === 'details' && (
                    <form className="login-modal__form" onSubmit={requestOtp} noValidate>
                        <h1 id="login-modal-title" className="login-modal__brand">
                            Brechó da Cami
                        </h1>
                        <label className="login-modal__label" htmlFor="login-phone">
                            WhatsApp
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
                            className="login-modal__primary"
                            type="submit"
                            disabled={isLoading}
                        >
                            Entrar
                        </button>
                    </form>
                )}

                {step === 'otp' && (
                    <form className="login-modal__form" onSubmit={verifyOtp} noValidate>
                        <h1 id="login-modal-title" className="login-modal__brand">
                            Brechó da Cami
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
                            Entrar
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
