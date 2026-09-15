ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_status_check;

ALTER TABLE pedidos
ADD CONSTRAINT pedidos_status_check
CHECK (status IN (
    'PENDENTE',
    'AGUARDANDO_PAGAMENTO',
    'PAGO',
    'FALHOU',
    'CANCELADO',
    'EXPIRADO'
));

ALTER TABLE pagamentos DROP CONSTRAINT IF EXISTS pagamentos_status_check;

ALTER TABLE pagamentos
ADD CONSTRAINT pagamentos_status_check
CHECK (status IN (
    'PENDENTE',
    'AGUARDANDO_PAGAMENTO',
    'PAGO',
    'FALHOU',
    'CANCELADO',
    'EXPIRADO'
));
