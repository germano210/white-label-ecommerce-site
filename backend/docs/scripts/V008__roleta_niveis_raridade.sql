ALTER TABLE roleta_config ADD COLUMN IF NOT EXISTS multiplicador_dificuldade_padrao numeric(10, 2);
ALTER TABLE roleta_config ADD COLUMN IF NOT EXISTS usar_pesos_manuais boolean;

UPDATE roleta_config
SET multiplicador_dificuldade_padrao = COALESCE(multiplicador_dificuldade_padrao, 5.00),
    usar_pesos_manuais = COALESCE(usar_pesos_manuais, true);

ALTER TABLE roleta_config ALTER COLUMN multiplicador_dificuldade_padrao SET DEFAULT 5.00;
ALTER TABLE roleta_config ALTER COLUMN multiplicador_dificuldade_padrao SET NOT NULL;
ALTER TABLE roleta_config ALTER COLUMN usar_pesos_manuais SET DEFAULT true;
ALTER TABLE roleta_config ALTER COLUMN usar_pesos_manuais SET NOT NULL;

CREATE TABLE IF NOT EXISTS roleta_niveis (
    id bigserial PRIMARY KEY,
    nome varchar(120) NOT NULL,
    descricao varchar(500),
    cor_hex varchar(7) NOT NULL,
    ordem integer NOT NULL,
    peso_relativo numeric(18, 8) NOT NULL DEFAULT 1.00000000,
    ativo boolean NOT NULL DEFAULT true,
    criado_em timestamp NOT NULL DEFAULT now(),
    atualizado_em timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_roleta_niveis_ordem
    ON roleta_niveis (ordem);

CREATE UNIQUE INDEX IF NOT EXISTS ux_roleta_niveis_nome_normalizado
    ON roleta_niveis (lower(trim(nome)));
