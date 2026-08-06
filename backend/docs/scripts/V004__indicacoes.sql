ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS codigo_indicacao varchar(40);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS indicado_por_id uuid;

CREATE UNIQUE INDEX IF NOT EXISTS uk_usuarios_codigo_indicacao
    ON usuarios (codigo_indicacao);

DO $$
BEGIN
    ALTER TABLE usuarios
        ADD CONSTRAINT fk_usuarios_indicado_por
        FOREIGN KEY (indicado_por_id) REFERENCES usuarios(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS indicacoes (
    id bigserial PRIMARY KEY,
    codigo varchar(40) NOT NULL,
    usuario_indicador_id uuid NOT NULL REFERENCES usuarios(id),
    usuario_indicado_id uuid REFERENCES usuarios(id),
    aberto_em timestamp,
    convertido_em timestamp,
    status varchar(30) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_indicacoes_codigo
    ON indicacoes (codigo);

CREATE INDEX IF NOT EXISTS idx_indicacoes_indicador
    ON indicacoes (usuario_indicador_id);

CREATE INDEX IF NOT EXISTS idx_indicacoes_indicado
    ON indicacoes (usuario_indicado_id);
