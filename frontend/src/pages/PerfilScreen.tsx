import { useAuthStore } from '../store/useAuthStore';

function getDisplayName(user: ReturnType<typeof useAuthStore.getState>['user']) {
    const nome = typeof user?.nome === 'string' ? user.nome.trim() : '';
    const name = typeof user?.name === 'string' ? user.name.trim() : '';

    return nome || name || 'Cliente';
}

function getDisplayPhone(user: ReturnType<typeof useAuthStore.getState>['user']) {
    const telefone = typeof user?.telefone === 'string' ? user.telefone.trim() : '';
    const phone = typeof user?.phone === 'string' ? user.phone.trim() : '';

    return telefone || phone || 'Telefone não informado';
}

export function PerfilScreen() {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    return (
        <main style={screenStyle}>
            <section style={panelStyle}>
                <span style={eyebrowStyle}>Perfil</span>
                {user ? (
                    <>
                        <h1 style={titleStyle}>{getDisplayName(user)}</h1>
                        <div style={infoRowStyle}>
                            <span style={infoLabelStyle}>Telefone</span>
                            <strong style={infoValueStyle}>{getDisplayPhone(user)}</strong>
                        </div>
                        <button type="button" onClick={logout} style={buttonStyle}>
                            Sair da conta
                        </button>
                    </>
                ) : (
                    <>
                        <h1 style={titleStyle}>Entre para ver seu perfil</h1>
                        <p style={descriptionStyle}>
                            Use o login por telefone e OTP para carregar seus dados reais.
                        </p>
                    </>
                )}
            </section>
        </main>
    );
}

const screenStyle: React.CSSProperties = {
    minHeight: '100dvh',
    width: '100%',
    maxWidth: '430px',
    margin: '0 auto',
    padding: '18px',
    background: '#FAF7F2',
    color: 'var(--text-dark)',
};

const panelStyle: React.CSSProperties = {
    display: 'flex',
    minHeight: 'calc(100dvh - 36px)',
    flexDirection: 'column',
    justifyContent: 'center',
    borderRadius: '18px',
    background: '#ffffff',
    padding: '24px',
    boxShadow: '0 14px 34px rgba(25, 21, 16, 0.08)',
};

const eyebrowStyle: React.CSSProperties = {
    color: '#687152',
    fontSize: '11px',
    fontWeight: 900,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
};

const titleStyle: React.CSSProperties = {
    margin: '10px 0 0',
    color: 'var(--text-dark)',
    fontSize: '28px',
    fontWeight: 900,
    lineHeight: 1.05,
};

const descriptionStyle: React.CSSProperties = {
    margin: '12px 0 0',
    color: 'var(--text-muted)',
    fontSize: '14px',
    lineHeight: 1.5,
};

const infoRowStyle: React.CSSProperties = {
    marginTop: '22px',
    borderRadius: '14px',
    background: '#F6F4EF',
    padding: '14px',
};

const infoLabelStyle: React.CSSProperties = {
    display: 'block',
    color: 'var(--text-muted)',
    fontSize: '10px',
    fontWeight: 900,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
};

const infoValueStyle: React.CSSProperties = {
    display: 'block',
    marginTop: '6px',
    color: 'var(--text-dark)',
    fontSize: '16px',
};

const buttonStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '48px',
    marginTop: '22px',
    border: 0,
    borderRadius: '14px',
    background: '#2f3328',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 900,
    cursor: 'pointer',
};

