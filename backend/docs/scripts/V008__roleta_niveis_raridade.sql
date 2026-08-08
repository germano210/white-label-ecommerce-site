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

INSERT INTO roleta_niveis (
    nome,
    descricao,
    cor_hex,
    ordem,
    peso_relativo,
    ativo,
    criado_em,
    atualizado_em
)
SELECT *
FROM (
    VALUES
        ('Grau Militar', 'Azul, raridade mais comum.', '#4b69ff', 1, 1.00000000, true, now(), now()),
        ('Restrito', 'Roxo, aproximadamente cinco vezes mais dificil.', '#8847ff', 2, 0.20000000, true, now(), now()),
        ('Classificado', 'Rosa, queda rara.', '#d32ce6', 3, 0.04000000, true, now(), now()),
        ('Encoberto', 'Vermelho, premio secreto.', '#eb4b4b', 4, 0.00800000, true, now(), now()),
        ('Extremamente Raro', 'Ouro, queda premium.', '#ffd700', 5, 0.00325000, true, now(), now())
) AS padrao (
    nome,
    descricao,
    cor_hex,
    ordem,
    peso_relativo,
    ativo,
    criado_em,
    atualizado_em
)
WHERE NOT EXISTS (SELECT 1 FROM roleta_niveis);
