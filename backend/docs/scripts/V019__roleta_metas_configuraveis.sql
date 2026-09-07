CREATE TABLE IF NOT EXISTS roleta_metas (
    id BIGSERIAL PRIMARY KEY,
    titulo VARCHAR(120) NOT NULL,
    descricao VARCHAR(500),
    quantidade_alvo INTEGER NOT NULL,
    giros_recompensa INTEGER NOT NULL,
    progresso_atual INTEGER NOT NULL DEFAULT 0,
    ordem INTEGER NOT NULL DEFAULT 0,
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(30) NOT NULL DEFAULT 'NAO_INICIADA',
    criada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizada_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    iniciada_em TIMESTAMP,
    concluida_em TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_roleta_metas_atual
    ON roleta_metas (ativa, status, ordem, id);
