export function ExplorarScreen() {
    return (
        <main style={screenStyle}>
            <section style={panelStyle}>
                <span style={eyebrowStyle}>Explorar</span>
                <h1 style={titleStyle}>Novas formas de garimpar</h1>
                <p style={descriptionStyle}>
                    Dados indisponíveis enquanto o módulo Explorar não está integrado à API.
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

