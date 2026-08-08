CREATE TABLE IF NOT EXISTS roleta_opcoes (
    id bigserial PRIMARY KEY,
    nivel integer NOT NULL,
    titulo varchar(120) NOT NULL,
    descricao varchar(500),
    tipo_premio varchar(40) NOT NULL,
    valor_minimo numeric(12, 2),
    valor_maximo numeric(12, 2),
    peso integer NOT NULL DEFAULT 1,
    ativa boolean NOT NULL DEFAULT true,
    ordem integer NOT NULL DEFAULT 0,
    criada_em timestamp NOT NULL DEFAULT now(),
    atualizada_em timestamp NOT NULL DEFAULT now()
);

INSERT INTO roleta_opcoes (
    nivel,
    titulo,
    descricao,
    tipo_premio,
    valor_minimo,
    valor_maximo,
    peso,
    ativa,
    ordem,
    criada_em,
    atualizada_em
)
SELECT *
FROM (
    VALUES
        (1, 'R$ 2 OFF', 'Desconto pequeno para usar na loja.', 'DESCONTO_VALOR', 2.00, 2.00, 30, true, 0, now(), now()),
        (1, 'R$ 5 OFF', 'Desconto em dinheiro para compra impulsiva.', 'DESCONTO_VALOR', 5.00, 5.00, 20, true, 1, now(), now()),
        (2, '+1 giro', 'Ganha uma nova tentativa na roleta.', 'GIRO_EXTRA', 1.00, 1.00, 10, true, 2, now(), now()),
        (2, 'Quase', 'Nao foi dessa vez.', 'SEM_PREMIO', 0.00, 0.00, 40, true, 3, now(), now())
) AS padrao (
    nivel,
    titulo,
    descricao,
    tipo_premio,
    valor_minimo,
    valor_maximo,
    peso,
    ativa,
    ordem,
    criada_em,
    atualizada_em
)
WHERE NOT EXISTS (SELECT 1 FROM roleta_opcoes);

ALTER TABLE roleta_giros ADD COLUMN IF NOT EXISTS opcao_id bigint;
ALTER TABLE roleta_giros ADD COLUMN IF NOT EXISTS tipo_premio varchar(40);
ALTER TABLE roleta_giros ADD COLUMN IF NOT EXISTS titulo_premio varchar(120);
ALTER TABLE roleta_giros ADD COLUMN IF NOT EXISTS descricao_premio varchar(500);
ALTER TABLE roleta_giros ADD COLUMN IF NOT EXISTS valor_premio numeric(12, 2);
ALTER TABLE roleta_giros ADD COLUMN IF NOT EXISTS giros_extras integer;

UPDATE roleta_giros
SET tipo_premio = COALESCE(tipo_premio, 'DESCONTO_VALOR'),
    valor_premio = COALESCE(valor_premio, valor_desconto, 0.00),
    giros_extras = COALESCE(giros_extras, 0);

ALTER TABLE roleta_giros ALTER COLUMN valor_premio SET DEFAULT 0.00;
ALTER TABLE roleta_giros ALTER COLUMN giros_extras SET DEFAULT 0;
ALTER TABLE roleta_giros ALTER COLUMN giros_extras SET NOT NULL;

DO $$
BEGIN
    ALTER TABLE roleta_giros
        ADD CONSTRAINT fk_roleta_giros_opcao
        FOREIGN KEY (opcao_id) REFERENCES roleta_opcoes(id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
