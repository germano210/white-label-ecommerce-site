ALTER TABLE produtos ADD COLUMN IF NOT EXISTS status varchar(30);

UPDATE produtos
SET status = CASE
    WHEN ativo = false THEN 'INATIVO'
    ELSE COALESCE(status, 'DISPONIVEL')
END;

ALTER TABLE produtos ALTER COLUMN status SET DEFAULT 'DISPONIVEL';
ALTER TABLE produtos ALTER COLUMN status SET NOT NULL;

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS produto_desconto_id bigint;

CREATE INDEX IF NOT EXISTS idx_pedidos_produto_desconto
    ON pedidos(produto_desconto_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_pedidos_produto_desconto'
    ) THEN
        ALTER TABLE pedidos
            ADD CONSTRAINT fk_pedidos_produto_desconto
            FOREIGN KEY (produto_desconto_id)
            REFERENCES produtos(id);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS produto_reservas (
    id bigserial PRIMARY KEY,
    produto_id bigint NOT NULL REFERENCES produtos(id),
    usuario_id uuid NOT NULL REFERENCES usuarios(id),
    pedido_id bigint REFERENCES pedidos(id),
    status varchar(30) NOT NULL,
    reservado_em timestamp NOT NULL DEFAULT now(),
    expira_em timestamp NOT NULL,
    finalizado_em timestamp,
    atualizado_em timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_produto_reservas_produto_status
    ON produto_reservas(produto_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS uk_produto_reservas_produto_ativa
    ON produto_reservas(produto_id)
    WHERE status = 'ATIVA';

CREATE INDEX IF NOT EXISTS idx_produto_reservas_usuario_status
    ON produto_reservas(usuario_id, status);

CREATE INDEX IF NOT EXISTS idx_produto_reservas_pedido
    ON produto_reservas(pedido_id);

CREATE INDEX IF NOT EXISTS idx_produto_reservas_expiracao
    ON produto_reservas(status, expira_em);
