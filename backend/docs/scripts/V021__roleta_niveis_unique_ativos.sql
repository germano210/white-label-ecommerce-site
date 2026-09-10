BEGIN;

DROP INDEX IF EXISTS ux_roleta_niveis_ordem;
DROP INDEX IF EXISTS ux_roleta_niveis_nome_normalizado;

WITH duplicados_por_ordem AS (
    SELECT id,
           MIN(id) OVER (PARTITION BY ordem) AS nivel_mantido_id
    FROM roleta_niveis
    WHERE ativo = true
),
duplicados AS (
    SELECT id
    FROM duplicados_por_ordem
    WHERE id <> nivel_mantido_id
)
UPDATE roleta_niveis nivel
SET ativo = false,
    atualizado_em = now()
FROM duplicados
WHERE nivel.id = duplicados.id;

WITH duplicados_por_nome AS (
    SELECT id,
           MIN(id) OVER (PARTITION BY lower(trim(nome))) AS nivel_mantido_id
    FROM roleta_niveis
    WHERE ativo = true
),
duplicados AS (
    SELECT id
    FROM duplicados_por_nome
    WHERE id <> nivel_mantido_id
)
UPDATE roleta_niveis nivel
SET ativo = false,
    atualizado_em = now()
FROM duplicados
WHERE nivel.id = duplicados.id;

CREATE UNIQUE INDEX IF NOT EXISTS ux_roleta_niveis_ordem_ativo
    ON roleta_niveis (ordem)
    WHERE ativo = true;

CREATE UNIQUE INDEX IF NOT EXISTS ux_roleta_niveis_nome_normalizado_ativo
    ON roleta_niveis (lower(trim(nome)))
    WHERE ativo = true;

COMMIT;
