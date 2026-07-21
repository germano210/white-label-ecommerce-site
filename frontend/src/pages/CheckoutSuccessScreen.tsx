import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../utils/api';
import { apiRoutes } from '../utils/apiRoutes';

interface CheckoutStatusResponse {
    id?: string | number;
    pedidoId?: string | number;
    status?: string;
    pagamentoStatus?: string;
}

function getStatusLabel(status: string | undefined) {
    if (!status) return 'Status indisponível';

    const normalizedStatus = status.toUpperCase();
    if (normalizedStatus === 'PAGO' || normalizedStatus === 'APROVADO') return 'Pagamento confirmado';
    if (normalizedStatus === 'PENDENTE') return 'Pagamento pendente';
    if (normalizedStatus === 'CANCELADO') return 'Pagamento cancelado';

    return status;
}

export function CheckoutSuccessScreen() {
    const location = useLocation();
    const pedidoId = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get('pedidoId') ?? params.get('pedido') ?? params.get('orderId');
    }, [location.search]);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(Boolean(pedidoId));

    useEffect(() => {
        if (!pedidoId) return;

        let isActive = true;

        const fetchCheckoutStatus = async () => {
            setIsLoading(true);
            setError('');

            try {
                const { data } = await api.get<CheckoutStatusResponse>(
                    apiRoutes.checkout.status(pedidoId),
                );

                if (!isActive) return;
                setStatus(data.pagamentoStatus ?? data.status ?? '');
            } catch {
                if (isActive) {
                    setError('Não foi possível confirmar o status do pedido agora.');
                }
            } finally {
                if (isActive) setIsLoading(false);
            }
        };

        void fetchCheckoutStatus();

        return () => {
            isActive = false;
        };
    }, [pedidoId]);

    return (
        <main style={screenStyle}>
            <section style={panelStyle}>
                <span style={eyebrowStyle}>Checkout</span>
                <h1 style={titleStyle}>Status do pedido</h1>

                {!pedidoId && (
                    <p style={descriptionStyle}>
                        Não recebemos o identificador do pedido para consultar o backend.
                    </p>
                )}

                {pedidoId && isLoading && (
                    <p style={descriptionStyle}>Consultando o status real do pedido...</p>
                )}

                {pedidoId && !isLoading && error && (
                    <p role="alert" style={errorStyle}>{error}</p>
                )}

                {pedidoId && !isLoading && !error && (
                    <div style={statusBoxStyle}>
                        <span style={statusLabelStyle}>Pedido</span>
                        <strong style={statusValueStyle}>{pedidoId}</strong>
                        <span style={statusLabelStyle}>Status</span>
                        <strong style={statusValueStyle}>{getStatusLabel(status)}</strong>
                    </div>
                )}

                <p style={securityNoteStyle}>
                    Produtos, tentativas e recompensas só devem ser liberados após confirmação real no backend.
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

const errorStyle: React.CSSProperties = {
    margin: '14px 0 0',
    borderRadius: '14px',
    background: '#FFF0ED',
    color: '#A63D2F',
    padding: '12px',
    fontSize: '13px',
    fontWeight: 700,
};

const statusBoxStyle: React.CSSProperties = {
    display: 'grid',
    gap: '7px',
    marginTop: '18px',
    borderRadius: '14px',
    background: '#F6F4EF',
    padding: '14px',
};

const statusLabelStyle: React.CSSProperties = {
    color: 'var(--text-muted)',
    fontSize: '10px',
    fontWeight: 900,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
};

const statusValueStyle: React.CSSProperties = {
    color: 'var(--text-dark)',
    fontSize: '16px',
};

const securityNoteStyle: React.CSSProperties = {
    margin: '18px 0 0',
    color: 'var(--text-muted)',
    fontSize: '12px',
    lineHeight: 1.45,
};

