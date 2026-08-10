CREATE TABLE IF NOT EXISTS roleta_giro_creditos (
    id bigserial PRIMARY KEY,
    participante_id bigint NOT NULL REFERENCES roleta_participantes(id),
    chave_evento varchar(180) NOT NULL,
    tipo varchar(40) NOT NULL,
    quantidade integer NOT NULL,
    criado_em timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_roleta_giro_credito_evento
    ON roleta_giro_creditos(chave_evento);

CREATE INDEX IF NOT EXISTS idx_roleta_giro_creditos_participante
    ON roleta_giro_creditos(participante_id);

ALTER TABLE roleta_config ADD COLUMN IF NOT EXISTS ciclo_meta_grupo integer;

UPDATE roleta_config
SET ciclo_meta_grupo = COALESCE(ciclo_meta_grupo, 0);

ALTER TABLE roleta_config ALTER COLUMN ciclo_meta_grupo SET DEFAULT 0;
ALTER TABLE roleta_config ALTER COLUMN ciclo_meta_grupo SET NOT NULL;
