import { useState, type FormEvent } from 'react';
import axios from 'axios';
import { Lock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore, type AdminUser, type Role } from '../../store/useAdminStore';
import { api } from '../../utils/api';
import { apiRoutes } from '../../utils/apiRoutes';
import { appRoutes } from '../../utils/appRoutes';

interface AdminLoginResponse {
    token: string;
    tipo: 'Bearer' | string;
    usuario: {
        id: string | number;
        nome: string;
        email: string;
        role: Role;
    };
}

function getAdminLoginErrorMessage(error: unknown) {
    if (!axios.isAxiosError(error)) {
        return 'Não foi possível entrar no painel agora. Tente novamente.';
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
        return 'E-mail ou senha inválidos, ou usuário sem permissão administrativa.';
    }

    return 'Não foi possível conectar ao servidor de autenticação.';
}

export function AdminLoginScreen() {
    const navigate = useNavigate();
    const login = useAdminStore((state) => state.login);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const { data } = await api.post<AdminLoginResponse>(apiRoutes.auth.adminLogin, {
                email: email.trim(),
                senha: password,
            });

            if (!data.token) {
                throw new Error('Resposta de login admin sem token.');
            }

            const user: AdminUser = {
                id: String(data.usuario.id),
                name: data.usuario.nome,
                email: data.usuario.email,
                role: data.usuario.role,
            };

            login(user, data.token);
        } catch (loginError) {
            setError(getAdminLoginErrorMessage(loginError));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--cream)', zIndex: 3000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <button onClick={() => navigate(appRoutes.forYou)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '14px', color: 'var(--muted)', cursor: 'pointer' }}>
                Voltar à Loja
            </button>

            <div style={{ background: 'white', padding: '40px 24px', borderRadius: '24px', width: '100%', maxWidth: '360px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 600, color: 'var(--dark)', marginBottom: '8px' }}>
                    Brechó <span style={{ color: 'var(--terra)' }}>da Cami</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '30px' }}>
                    Painel do Lojista
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F9F9F9', padding: '14px 16px', borderRadius: '16px', border: '1px solid #EEE' }}>
                        <User size={20} color="#999" />
                        <input
                            type="email"
                            placeholder="E-mail"
                            value={email}
                            onChange={(event) => {
                                setEmail(event.target.value);
                                setError('');
                            }}
                            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px' }}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F9F9F9', padding: '14px 16px', borderRadius: '16px', border: '1px solid #EEE' }}>
                        <Lock size={20} color="#999" />
                        <input
                            type="password"
                            placeholder="Senha"
                            value={password}
                            onChange={(event) => {
                                setPassword(event.target.value);
                                setError('');
                            }}
                            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px' }}
                            required
                        />
                    </div>

                    {error && (
                        <div role="alert" style={{ padding: '12px', borderRadius: '12px', background: '#FFF0ED', color: '#A63D2F', fontSize: '12px', fontWeight: 700, textAlign: 'left' }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" disabled={isLoading} style={{ background: 'var(--dark)', color: 'white', border: 'none', padding: '16px', borderRadius: '16px', fontSize: '14px', fontWeight: 700, marginTop: '10px', cursor: isLoading ? 'wait' : 'pointer', opacity: isLoading ? 0.7 : 1 }}>
                        {isLoading ? 'Entrando...' : 'Entrar no Sistema'}
                    </button>
                </form>

                <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--muted)', textAlign: 'left', background: '#F5F5F5', padding: '10px', borderRadius: '8px' }}>
                    <strong>Dica de teste:</strong><br />
                    germano@brechocami.com<br />
                    senhasegura@123
                </div>
            </div>
        </div>
    );
}
