BEGIN;

WITH duplicados_por_ordem AS (
    SELECT id,
           MIN(id) OVER (PARTITION BY ordem) AS nivel_mantido_id
    FROM roleta_niveis
),
duplicados AS (
    SELECT id, nivel_mantido_id
    FROM duplicados_por_ordem
    WHERE id <> nivel_mantido_id
)
UPDATE roleta_premios premio
SET nivel_id = duplicados.nivel_mantido_id
FROM duplicados
WHERE premio.nivel_id = duplicados.id;

WITH duplicados_por_ordem AS (
    SELECT id,
           MIN(id) OVER (PARTITION BY ordem) AS nivel_mantido_id
    FROM roleta_niveis
),
duplicados AS (
    SELECT id, nivel_mantido_id
    FROM duplicados_por_ordem
    WHERE id <> nivel_mantido_id
)
UPDATE roleta_giros giro
SET nivel_id = duplicados.nivel_mantido_id
FROM duplicados
WHERE giro.nivel_id = duplicados.id;

WITH duplicados_por_ordem AS (
    SELECT id,
           MIN(id) OVER (PARTITION BY ordem) AS nivel_mantido_id
    FROM roleta_niveis
),
duplicados AS (
    SELECT id
    FROM duplicados_por_ordem
    WHERE id <> nivel_mantido_id
)
DELETE FROM roleta_niveis nivel
USING duplicados
WHERE nivel.id = duplicados.id;

WITH duplicados_por_nome AS (
    SELECT id,
           MIN(id) OVER (PARTITION BY lower(trim(nome))) AS nivel_mantido_id
    FROM roleta_niveis
),
duplicados AS (
    SELECT id, nivel_mantido_id
    FROM duplicados_por_nome
    WHERE id <> nivel_mantido_id
)
UPDATE roleta_premios premio
SET nivel_id = duplicados.nivel_mantido_id
FROM duplicados
WHERE premio.nivel_id = duplicados.id;

WITH duplicados_por_nome AS (
    SELECT id,
           MIN(id) OVER (PARTITION BY lower(trim(nome))) AS nivel_mantido_id
    FROM roleta_niveis
),
duplicados AS (
    SELECT id, nivel_mantido_id
    FROM duplicados_por_nome
    WHERE id <> nivel_mantido_id
)
UPDATE roleta_giros giro
SET nivel_id = duplicados.nivel_mantido_id
FROM duplicados
WHERE giro.nivel_id = duplicados.id;

WITH duplicados_por_nome AS (
    SELECT id,
           MIN(id) OVER (PARTITION BY lower(trim(nome))) AS nivel_mantido_id
    FROM roleta_niveis
),
duplicados AS (
    SELECT id
    FROM duplicados_por_nome
    WHERE id <> nivel_mantido_id
)
DELETE FROM roleta_niveis nivel
USING duplicados
WHERE nivel.id = duplicados.id;

CREATE UNIQUE INDEX IF NOT EXISTS ux_roleta_niveis_ordem
    ON roleta_niveis (ordem);

CREATE UNIQUE INDEX IF NOT EXISTS ux_roleta_niveis_nome_normalizado
    ON roleta_niveis (lower(trim(nome)));

COMMIT;
