export function IndiqueScreen() {
    return (
        <main style={screenStyle}>
            <section style={panelStyle}>
                <span style={eyebrowStyle}>Indique e Ganhe</span>
                <h1 style={titleStyle}>Convites aguardando integração</h1>
                <p style={descriptionStyle}>
                    Dados de indicações, convidados e recompensas ficam ocultos até existir endpoint real.
                </p>
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

