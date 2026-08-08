CREATE TABLE IF NOT EXISTS roleta_config (
    id bigint PRIMARY KEY,
    ativa boolean NOT NULL DEFAULT true,
    titulo varchar(120) NOT NULL DEFAULT 'Brecho da Cami',
    meta_grupo integer NOT NULL DEFAULT 20,
    progresso_grupo integer NOT NULL DEFAULT 0,
    giros_bonus_grupo integer NOT NULL DEFAULT 5,
    giros_iniciais integer NOT NULL DEFAULT 8,
    giro_diario_quantidade integer NOT NULL DEFAULT 1,
    giro_diario_somente_quando_zerar boolean NOT NULL DEFAULT true,
    giros_ganhos_por_convite integer NOT NULL DEFAULT 1,
    atualizada_em timestamp NOT NULL DEFAULT now()
);

INSERT INTO roleta_config (
    id,
    ativa,
    titulo,
    meta_grupo,
    progresso_grupo,
    giros_bonus_grupo,
    giros_iniciais,
    giro_diario_quantidade,
    giro_diario_somente_quando_zerar,
    giros_ganhos_por_convite,
    atualizada_em
)
VALUES (1, true, 'Brecho da Cami', 20, 0, 5, 8, 1, true, 1, now())
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS roleta_participantes (
    id bigserial PRIMARY KEY,
    usuario_id uuid NOT NULL REFERENCES usuarios(id),
    codigo_convite varchar(40) NOT NULL,
    giros_totais_obtidos integer NOT NULL DEFAULT 0,
    giros_disponiveis integer NOT NULL DEFAULT 0,
    valor_disponivel_resgate numeric(12, 2) NOT NULL DEFAULT 0.00,
    valor_total_resgatado numeric(12, 2) NOT NULL DEFAULT 0.00,
    ultimo_giro_diario_em timestamp,
    convites_convertidos integer NOT NULL DEFAULT 0,
    criado_em timestamp NOT NULL DEFAULT now(),
    atualizado_em timestamp NOT NULL DEFAULT now()
);

ALTER TABLE roleta_participantes ADD COLUMN IF NOT EXISTS giros_totais_obtidos integer;
ALTER TABLE roleta_participantes ADD COLUMN IF NOT EXISTS valor_disponivel_resgate numeric(12, 2);
ALTER TABLE roleta_participantes ADD COLUMN IF NOT EXISTS valor_total_resgatado numeric(12, 2);
ALTER TABLE roleta_participantes ADD COLUMN IF NOT EXISTS convites_convertidos integer;

UPDATE roleta_participantes
SET giros_totais_obtidos = COALESCE(giros_totais_obtidos, giros_disponiveis, 0),
    valor_disponivel_resgate = COALESCE(valor_disponivel_resgate, 0.00),
    valor_total_resgatado = COALESCE(valor_total_resgatado, 0.00),
    convites_convertidos = COALESCE(convites_convertidos, 0);

ALTER TABLE roleta_participantes ALTER COLUMN giros_totais_obtidos SET DEFAULT 0;
ALTER TABLE roleta_participantes ALTER COLUMN giros_totais_obtidos SET NOT NULL;
ALTER TABLE roleta_participantes ALTER COLUMN valor_disponivel_resgate SET DEFAULT 0.00;
ALTER TABLE roleta_participantes ALTER COLUMN valor_disponivel_resgate SET NOT NULL;
ALTER TABLE roleta_participantes ALTER COLUMN valor_total_resgatado SET DEFAULT 0.00;
ALTER TABLE roleta_participantes ALTER COLUMN valor_total_resgatado SET NOT NULL;
ALTER TABLE roleta_participantes ALTER COLUMN convites_convertidos SET DEFAULT 0;
ALTER TABLE roleta_participantes ALTER COLUMN convites_convertidos SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_roleta_participante_usuario
    ON roleta_participantes (usuario_id);

CREATE UNIQUE INDEX IF NOT EXISTS uk_roleta_participante_codigo
    ON roleta_participantes (codigo_convite);

CREATE TABLE IF NOT EXISTS roleta_convites (
    id bigserial PRIMARY KEY,
    indicador_id uuid NOT NULL REFERENCES usuarios(id),
    indicado_id uuid REFERENCES usuarios(id),
    codigo varchar(40) NOT NULL,
    giros_concedidos integer NOT NULL DEFAULT 0,
    status varchar(30) NOT NULL DEFAULT 'CONVERTIDO',
    criado_em timestamp NOT NULL DEFAULT now(),
    convertido_em timestamp
);

ALTER TABLE roleta_convites ADD COLUMN IF NOT EXISTS giros_concedidos integer;
ALTER TABLE roleta_convites ADD COLUMN IF NOT EXISTS convertido_em timestamp;

UPDATE roleta_convites
SET giros_concedidos = COALESCE(
        giros_concedidos,
        (SELECT giros_ganhos_por_convite FROM roleta_config WHERE id = 1),
        1
    ),
    convertido_em = CASE
        WHEN status = 'CONVERTIDO' THEN COALESCE(convertido_em, criado_em, now())
        ELSE convertido_em
    END;

ALTER TABLE roleta_convites ALTER COLUMN giros_concedidos SET DEFAULT 0;
ALTER TABLE roleta_convites ALTER COLUMN giros_concedidos SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_roleta_convite_indicado
    ON roleta_convites (indicado_id)
    WHERE indicado_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS roleta_giros (
    id bigserial PRIMARY KEY,
    usuario_id uuid NOT NULL REFERENCES usuarios(id),
    valor_desconto numeric(10, 2) NOT NULL,
    status varchar(30) NOT NULL DEFAULT 'PENDENTE',
    criado_em timestamp NOT NULL DEFAULT now(),
    usado_em timestamp
);

CREATE TABLE IF NOT EXISTS roleta_produtos (
    id bigserial PRIMARY KEY,
    produto_id bigint NOT NULL REFERENCES produtos(id),
    ativo boolean NOT NULL DEFAULT true,
    ordem integer NOT NULL DEFAULT 0,
    criado_em timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_roleta_produto_produto
    ON roleta_produtos (produto_id);
