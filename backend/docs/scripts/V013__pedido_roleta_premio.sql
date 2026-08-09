ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS roleta_giro_id bigint;

CREATE INDEX IF NOT EXISTS idx_pedidos_roleta_giro ON pedidos (roleta_giro_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_pedidos_roleta_giro'
    ) THEN
        ALTER TABLE pedidos
            ADD CONSTRAINT fk_pedidos_roleta_giro
            FOREIGN KEY (roleta_giro_id)
            REFERENCES roleta_giros(id);
    END IF;
END $$;
