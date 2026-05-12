import { useState } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { Lock, User } from 'lucide-react';

export function AdminLoginScreen() {
    const { login, toggleAdminMode } = useAdminStore();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        // MOCK DE LOGIN - No futuro o Spring Boot fará isso
        if (email === 'admin@viabras.com') {
            login({ id: '1', name: 'Germano (Admin)', role: 'ADMIN' });
        } else if (email === 'vendedor@viabras.com') {
            login({ id: '2', name: 'Ana (Vendedora)', role: 'VENDEDOR' });
        } else {
            alert('Credenciais inválidas. Use admin@ ou vendedor@viabras.com');
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--cream)', zIndex: 3000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <button onClick={toggleAdminMode} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', fontSize: '14px', color: 'var(--muted)', cursor: 'pointer' }}>
                Voltar à Loja
            </button>

            <div style={{ background: 'white', padding: '40px 24px', borderRadius: '24px', width: '100%', maxWidth: '360px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 600, color: 'var(--dark)', marginBottom: '8px' }}>
                    Via <span style={{ color: 'var(--terra)' }}>Brás</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '30px' }}>
                    Painel do Lojista
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F9F9F9', padding: '14px 16px', borderRadius: '16px', border: '1px solid #EEE' }}>
                        <User size={20} color="#999" />
                        <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px' }} required />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F9F9F9', padding: '14px 16px', borderRadius: '16px', border: '1px solid #EEE' }}>
                        <Lock size={20} color="#999" />
                        <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px' }} required />
                    </div>

                    <button type="submit" style={{ background: 'var(--dark)', color: 'white', border: 'none', padding: '16px', borderRadius: '16px', fontSize: '14px', fontWeight: 700, marginTop: '10px', cursor: 'pointer' }}>
                        Entrar no Sistema
                    </button>
                </form>

                <div style={{ marginTop: '20px', fontSize: '12px', color: 'var(--muted)', textAlign: 'left', background: '#F5F5F5', padding: '10px', borderRadius: '8px' }}>
                    <strong>Dica de teste:</strong><br/>
                    Admin: admin@viabras.com<br/>
                    Vendedor: vendedor@viabras.com
                </div>
            </div>
        </div>
    );
}