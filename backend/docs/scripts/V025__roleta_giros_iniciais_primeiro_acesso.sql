ALTER TABLE roleta_config
    ALTER COLUMN giros_iniciais SET DEFAULT 3;

UPDATE roleta_config
SET giros_iniciais = 3,
    atualizada_em = now()
WHERE id = 1
  AND giros_iniciais = 8;
