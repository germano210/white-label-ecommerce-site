CREATE TABLE IF NOT EXISTS roleta_interacoes (
    id bigserial PRIMARY KEY,
    tipo varchar(40) NOT NULL,
    usuario_id uuid,
    usuario_nome_snapshot varchar(140),
    usuario_secundario_id uuid,
    usuario_secundario_nome_snapshot varchar(140),
    produto_id bigint,
    produto_nome_snapshot varchar(180),
    nivel_id bigint,
    nivel_nome_snapshot varchar(120),
    nivel_cor_hex varchar(20),
    premio_id bigint,
    valor numeric(12,2) DEFAULT 0.00,
    texto_snapshot varchar(500) NOT NULL,
    conta_para_meta boolean NOT NULL DEFAULT true,
    chave_evento varchar(180),
    criado_em timestamp NOT NULL DEFAULT now(),
    CONSTRAINT fk_roleta_interacoes_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_roleta_interacoes_usuario_secundario
        FOREIGN KEY (usuario_secundario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_roleta_interacoes_produto
        FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE SET NULL,
    CONSTRAINT fk_roleta_interacoes_nivel
        FOREIGN KEY (nivel_id) REFERENCES roleta_niveis(id) ON DELETE SET NULL,
    CONSTRAINT fk_roleta_interacoes_premio
        FOREIGN KEY (premio_id) REFERENCES roleta_premios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ix_roleta_interacoes_criado_em_id
    ON roleta_interacoes (criado_em DESC, id DESC);

CREATE UNIQUE INDEX IF NOT EXISTS ux_roleta_interacoes_chave_evento
    ON roleta_interacoes (chave_evento)
    WHERE chave_evento IS NOT NULL;
