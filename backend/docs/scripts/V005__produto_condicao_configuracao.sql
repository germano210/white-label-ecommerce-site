ALTER TABLE produtos ADD COLUMN IF NOT EXISTS condicao numeric(4, 2);
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS preco_custo numeric(12, 2);

UPDATE produtos
SET condicao = 0
WHERE condicao IS NULL;

ALTER TABLE produtos ALTER COLUMN condicao SET DEFAULT 0;
ALTER TABLE produtos ALTER COLUMN condicao SET NOT NULL;

CREATE TABLE IF NOT EXISTS loja_configuracao (
    id bigint PRIMARY KEY,
    condicao_casas_decimais integer NOT NULL DEFAULT 1,
    atualizada_em timestamp NOT NULL DEFAULT now(),
    CONSTRAINT ck_loja_configuracao_condicao_casas
        CHECK (condicao_casas_decimais IN (1, 2))
);

INSERT INTO loja_configuracao (id, condicao_casas_decimais, atualizada_em)
VALUES (1, 1, now())
ON CONFLICT (id) DO NOTHING;
