import { useState, type FormEvent } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft,
    Check,
    LoaderCircle,
    LockKeyhole,
    MessageCircle,
    Sparkles,
    UserRound,
} from 'lucide-react';
import { useAuthStore, type AuthUser } from '../../store/useAuthStore';
import { api, isCookieAuthMode } from '../../utils/api';
import { apiRoutes } from '../../utils/apiRoutes';
import './WelcomeModal.css';

type Step = 1 | 2 | 3 | 4;

interface VerifyOtpResponse {
    token?: string;
    accessToken?: string;
    usuario?: {
        name?: string;
        nome?: string;
        phone?: string;
        telefone?: string;
    };
    user?: {
        name?: string;
        nome?: string;
        phone?: string;
        telefone?: string;
    };
}

interface AuthMeResponse {
    usuario?: VerifyOtpResponse['usuario'];
    user?: VerifyOtpResponse['user'];
}

const stepMotion = {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
};

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

export function WelcomeModal() {
    const setSession = useAuthStore((state) => state.setSession);
    const [step, setStep] = useState<Step>(1);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const phoneDigits = onlyDigits(phone);

    const goToStep = (nextStep: Step) => {
        setError('');
        setStep(nextStep);
    };

    const chooseAccessMode = () => {
        goToStep(2);
    };

    const submitName = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const normalizedName = name.trim();

        if (normalizedName.length < 2) {
            setError('Conta pra gente como você gosta de ser chamada.');
            return;
        }

        setName(normalizedName);
        goToStep(3);
    };

    const requestOtp = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (phoneDigits.length < 10) {
            setError('Digite um WhatsApp com DDD para receber seu código.');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            await api.post(apiRoutes.auth.requestOtp, {
                telefone: phoneDigits,
                nome: name,
            });
            setOtp('');
            goToStep(4);
        } catch (requestError) {
            setError(getErrorMessage(
                requestError,
                'Não conseguimos enviar o código agora. Confira o número e tente de novo.',
            ));
        } finally {
            setIsLoading(false);
        }
    };

    const verifyOtp = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (otp.length !== 6) {
            setError('Digite os 6 números enviados para o seu WhatsApp.');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const payload = {
                telefone: onlyDigits(phone),
                codigo: otp,
            };

            const { data } = await api.post<VerifyOtpResponse>(apiRoutes.auth.verifyOtp, payload);
            const token = data.token ?? data.accessToken ?? null;

            if (!token && !isCookieAuthMode) {
                throw new Error('A resposta de autenticação não contém um token.');
            }

            let apiUser = data.usuario ?? data.user;
            if (!apiUser && isCookieAuthMode) {
                const { data: meData } = await api.get<AuthMeResponse>(apiRoutes.auth.me);
                apiUser = meData.usuario ?? meData.user;
            }

            const user: AuthUser = {
                ...(apiUser ?? {}),
                name: apiUser?.name ?? apiUser?.nome ?? name,
                nome: apiUser?.nome ?? apiUser?.name ?? name,
                phone: apiUser?.phone ?? apiUser?.telefone ?? phoneDigits,
                telefone: apiUser?.telefone ?? apiUser?.phone ?? phoneDigits,
            };

            setSession(token, user);
        } catch (verificationError) {
            setError(getErrorMessage(
                verificationError,
                'Código inválido ou expirado. Confira os números e tente novamente.',
            ));
        } finally {
            setIsLoading(false);
        }
    };

    const renderBackButton = (previousStep: Step) => (
        <button
            className="welcome-modal__back"
            type="button"
            onClick={() => goToStep(previousStep)}
            aria-label="Voltar para a etapa anterior"
        >
            <ArrowLeft size={20} />
        </button>
    );

    return (
        <motion.div
            className="welcome-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-modal-title"
        >
            <motion.div
                className="welcome-modal__card"
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
                <div className="welcome-modal__progress" aria-label={`Etapa ${step} de 4`}>
                    {[1, 2, 3, 4].map((item) => (
                        <span
                            key={item}
                            className={item <= step ? 'is-active' : ''}
                        />
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.section key="choice" {...stepMotion} className="welcome-modal__step">
                            <div className="welcome-modal__hero-icon">
                                <Sparkles size={28} />
                            </div>
                            <p className="welcome-modal__eyebrow">Seu garimpo começa aqui</p>
                            <h1 id="welcome-modal-title">Boas-vindas à Via Brás</h1>
                            <p className="welcome-modal__description">
                                Entre para descobrir peças, dar matches e guardar seus achados.
                            </p>

                            <div className="welcome-modal__actions">
                                <button
                                    className="welcome-modal__button welcome-modal__button--primary"
                                    type="button"
                                    onClick={chooseAccessMode}
                                >
                                    <Sparkles size={18} />
                                    Primeiro acesso
                                </button>
                                <button
                                    className="welcome-modal__button welcome-modal__button--secondary"
                                    type="button"
                                    onClick={chooseAccessMode}
                                >
                                    <LockKeyhole size={18} />
                                    Entrar na minha conta
                                </button>
                            </div>
                        </motion.section>
                    )}

                    {step === 2 && (
                        <motion.section key="name" {...stepMotion} className="welcome-modal__step">
                            {renderBackButton(1)}
                            <div className="welcome-modal__icon">
                                <UserRound size={24} />
                            </div>
                            <p className="welcome-modal__eyebrow">Vamos nos conhecer</p>
                            <h1 id="welcome-modal-title">Como podemos te chamar?</h1>
                            <p className="welcome-modal__description">
                                Seu nome deixa cada match um pouco mais seu.
                            </p>

                            <form onSubmit={submitName} noValidate>
                                <label className="welcome-modal__label" htmlFor="auth-name">
                                    Seu nome ou apelido
                                </label>
                                <input
                                    id="auth-name"
                                    className="welcome-modal__input"
                                    value={name}
                                    onChange={(event) => {
                                        setName(event.target.value.slice(0, 50));
                                        setError('');
                                    }}
                                    placeholder="Ex.: Ana"
                                    autoComplete="name"
                                    autoFocus
                                />
                                {error && <p className="welcome-modal__error" role="alert">{error}</p>}
                                <button className="welcome-modal__button welcome-modal__button--primary" type="submit">
                                    Continuar
                                </button>
                            </form>
                        </motion.section>
                    )}

                    {step === 3 && (
                        <motion.section key="phone" {...stepMotion} className="welcome-modal__step">
                            {renderBackButton(2)}
                            <div className="welcome-modal__icon">
                                <MessageCircle size={24} />
                            </div>
                            <p className="welcome-modal__eyebrow">Login sem senha</p>
                            <h1 id="welcome-modal-title">Qual é o seu Whats?</h1>
                            <p className="welcome-modal__description">
                                Enviaremos um código de 6 dígitos. Sem senha para decorar.
                            </p>

                            <form onSubmit={requestOtp} noValidate>
                                <label className="welcome-modal__label" htmlFor="auth-phone">
                                    Número com DDD
                                </label>
                                <input
                                    id="auth-phone"
                                    className="welcome-modal__input"
                                    value={phone}
                                    onChange={(event) => {
                                        setPhone(formatPhone(event.target.value));
                                        setError('');
                                    }}
                                    placeholder="(11) 99999-9999"
                                    inputMode="tel"
                                    autoComplete="tel"
                                    autoFocus
                                />
                                {error && <p className="welcome-modal__error" role="alert">{error}</p>}
                                <button
                                    className="welcome-modal__button welcome-modal__button--primary"
                                    type="submit"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <LoaderCircle className="welcome-modal__spinner" size={19} /> : <MessageCircle size={18} />}
                                    {isLoading ? 'Enviando código...' : 'Enviar código no WhatsApp'}
                                </button>
                            </form>
                        </motion.section>
                    )}

                    {step === 4 && (
                        <motion.section key="otp" {...stepMotion} className="welcome-modal__step">
                            {renderBackButton(3)}
                            <div className="welcome-modal__icon welcome-modal__icon--success">
                                <Check size={24} />
                            </div>
                            <p className="welcome-modal__eyebrow">Só falta confirmar</p>
                            <h1 id="welcome-modal-title">Digite o código</h1>
                            <p className="welcome-modal__description">
                                Enviamos para <strong>{phone}</strong>. Ele pode levar alguns segundos.
                            </p>

                            <form onSubmit={verifyOtp} noValidate>
                                <label className="welcome-modal__label" htmlFor="auth-otp">
                                    Código de 6 dígitos
                                </label>
                                <input
                                    id="auth-otp"
                                    className="welcome-modal__input welcome-modal__input--otp"
                                    value={otp}
                                    onChange={(event) => {
                                        setOtp(onlyDigits(event.target.value).slice(0, 6));
                                        setError('');
                                    }}
                                    placeholder="000000"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    autoFocus
                                />
                                {error && <p className="welcome-modal__error" role="alert">{error}</p>}
                                <button
                                    className="welcome-modal__button welcome-modal__button--primary"
                                    type="submit"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <LoaderCircle className="welcome-modal__spinner" size={19} /> : <Check size={18} />}
                                    {isLoading ? 'Confirmando...' : 'Confirmar e começar'}
                                </button>
                                <button
                                    className="welcome-modal__text-button"
                                    type="button"
                                    onClick={() => goToStep(3)}
                                    disabled={isLoading}
                                >
                                    Não recebeu? Reenviar código
                                </button>
                            </form>
                        </motion.section>
                    )}
                </AnimatePresence>

                <p className="welcome-modal__privacy">
                    Seus dados são usados apenas para proteger sua conta e suas compras.
                </p>
            </motion.div>
        </motion.div>
    );
}
