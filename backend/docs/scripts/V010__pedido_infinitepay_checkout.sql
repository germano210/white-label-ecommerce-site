ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS produto_id bigint;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS preco_original numeric(12, 2);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS desconto_aplicado numeric(12, 2);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS preco_final numeric(12, 2);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS order_nsu varchar(80);

UPDATE pedidos SET desconto_aplicado = 0 WHERE desconto_aplicado IS NULL;
UPDATE pedidos SET preco_original = valor_total WHERE preco_original IS NULL;
UPDATE pedidos SET preco_final = valor_total WHERE preco_final IS NULL;

ALTER TABLE pedidos ALTER COLUMN desconto_aplicado SET DEFAULT 0;
ALTER TABLE pedidos ALTER COLUMN desconto_aplicado SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_pedidos_order_nsu
    ON pedidos (order_nsu)
    WHERE order_nsu IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pedidos_produto ON pedidos (produto_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_pedidos_produto'
    ) THEN
        ALTER TABLE pedidos
            ADD CONSTRAINT fk_pedidos_produto
            FOREIGN KEY (produto_id)
            REFERENCES produtos(id);
    END IF;
END $$;
