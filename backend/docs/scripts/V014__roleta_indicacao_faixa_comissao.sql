ALTER TABLE roleta_config ADD COLUMN IF NOT EXISTS giros_por_convite_min integer;
ALTER TABLE roleta_config ADD COLUMN IF NOT EXISTS giros_por_convite_max integer;
ALTER TABLE roleta_config ADD COLUMN IF NOT EXISTS percentual_comissao_indicacao numeric(5, 2);

UPDATE roleta_config
SET giros_por_convite_min = COALESCE(giros_por_convite_min, 2),
    giros_por_convite_max = GREATEST(COALESCE(giros_por_convite_max, 5), COALESCE(giros_por_convite_min, 2)),
    percentual_comissao_indicacao = COALESCE(percentual_comissao_indicacao, 5.00);

ALTER TABLE roleta_config ALTER COLUMN giros_por_convite_min SET DEFAULT 2;
ALTER TABLE roleta_config ALTER COLUMN giros_por_convite_min SET NOT NULL;
ALTER TABLE roleta_config ALTER COLUMN giros_por_convite_max SET DEFAULT 5;
ALTER TABLE roleta_config ALTER COLUMN giros_por_convite_max SET NOT NULL;
ALTER TABLE roleta_config ALTER COLUMN percentual_comissao_indicacao SET DEFAULT 5.00;
ALTER TABLE roleta_config ALTER COLUMN percentual_comissao_indicacao SET NOT NULL;
