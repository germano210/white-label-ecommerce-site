CREATE TABLE IF NOT EXISTS roleta_giros_visitantes (
    id bigserial PRIMARY KEY,
    token varchar(96) NOT NULL,
    nivel_id bigint NOT NULL REFERENCES roleta_niveis(id),
    premio_id bigint NOT NULL REFERENCES roleta_premios(id),
    tipo_premio varchar(40) NOT NULL,
    valor_premio numeric(12,2) NOT NULL DEFAULT 0.00,
    nivel_nome_snapshot varchar(120),
    nivel_cor_hex varchar(7),
    status varchar(30) NOT NULL DEFAULT 'PENDENTE',
    usuario_id uuid REFERENCES usuarios(id),
    criado_em timestamp NOT NULL,
    expira_em timestamp NOT NULL,
    vinculado_em timestamp
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_roleta_giros_visitantes_token
    ON roleta_giros_visitantes(token);

CREATE INDEX IF NOT EXISTS idx_roleta_giros_visitantes_status_expira
    ON roleta_giros_visitantes(status, expira_em);

CREATE INDEX IF NOT EXISTS idx_roleta_giros_visitantes_usuario
    ON roleta_giros_visitantes(usuario_id);

ALTER TABLE roleta_giros_visitantes
    DROP CONSTRAINT IF EXISTS roleta_giros_visitantes_status_check;

ALTER TABLE roleta_giros_visitantes
    ADD CONSTRAINT roleta_giros_visitantes_status_check
    CHECK (status IN ('PENDENTE', 'VINCULADO', 'EXPIRADO'));
