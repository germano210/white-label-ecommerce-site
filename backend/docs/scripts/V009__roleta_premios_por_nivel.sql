CREATE TABLE IF NOT EXISTS roleta_premios (
    id bigserial PRIMARY KEY,
    nivel_id bigint NOT NULL,
    titulo varchar(120) NOT NULL,
    descricao varchar(500),
    tipo_premio varchar(40) NOT NULL,
    valor numeric(12, 2) NOT NULL DEFAULT 0.00,
    peso_interno numeric(18, 8) NOT NULL DEFAULT 1.00000000,
    ordem integer NOT NULL DEFAULT 0,
    ativo boolean NOT NULL DEFAULT true,
    criado_em timestamp NOT NULL DEFAULT now(),
    atualizado_em timestamp NOT NULL DEFAULT now(),
    CONSTRAINT fk_roleta_premios_nivel FOREIGN KEY (nivel_id) REFERENCES roleta_niveis(id)
);

DO $$
BEGIN
    ALTER TABLE roleta_premios
        ADD CONSTRAINT chk_roleta_premios_valor_nao_negativo
        CHECK (valor >= 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE roleta_premios
        ADD CONSTRAINT chk_roleta_premios_peso_interno_nao_negativo
        CHECK (peso_interno >= 0);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE roleta_giros ADD COLUMN IF NOT EXISTS nivel_id bigint;
ALTER TABLE roleta_giros ADD COLUMN IF NOT EXISTS premio_id bigint;

DO $$
BEGIN
    ALTER TABLE roleta_giros
        ADD CONSTRAINT fk_roleta_giros_nivel
        FOREIGN KEY (nivel_id) REFERENCES roleta_niveis(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE roleta_giros
        ADD CONSTRAINT fk_roleta_giros_premio
        FOREIGN KEY (premio_id) REFERENCES roleta_premios(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO roleta_premios (
    nivel_id,
    titulo,
    descricao,
    tipo_premio,
    valor,
    peso_interno,
    ordem,
    ativo,
    criado_em,
    atualizado_em
)
SELECT nivel.id,
       premio.titulo,
       premio.descricao,
       premio.tipo_premio,
       premio.valor,
       premio.peso_interno,
       premio.ordem,
       true,
       now(),
       now()
FROM roleta_niveis nivel
JOIN (
    VALUES
        (1, 'R$ 2 OFF', 'Desconto pequeno para usar na loja.', 'DESCONTO_VALOR', 2.00, 30.00000000, 0),
        (1, 'R$ 5 OFF', 'Desconto em dinheiro para compra impulsiva.', 'DESCONTO_VALOR', 5.00, 20.00000000, 1),
        (2, '+1 giro', 'Ganha uma nova tentativa na roleta.', 'GIRO_EXTRA', 1.00, 10.00000000, 0),
        (2, 'Quase', 'Nao foi dessa vez.', 'SEM_PREMIO', 0.00, 40.00000000, 1)
) AS premio (
    nivel_ordem,
    titulo,
    descricao,
    tipo_premio,
    valor,
    peso_interno,
    ordem
) ON premio.nivel_ordem = nivel.ordem
WHERE NOT EXISTS (SELECT 1 FROM roleta_premios);
