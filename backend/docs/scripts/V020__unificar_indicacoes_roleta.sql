UPDATE usuarios usuario
SET codigo_indicacao = participante.codigo_convite
FROM roleta_participantes participante
WHERE participante.usuario_id = usuario.id
  AND participante.codigo_convite IS NOT NULL
  AND participante.codigo_convite <> ''
  AND (usuario.codigo_indicacao IS NULL OR usuario.codigo_indicacao = '')
  AND NOT EXISTS (
      SELECT 1
      FROM usuarios outro_usuario
      WHERE outro_usuario.codigo_indicacao = participante.codigo_convite
        AND outro_usuario.id <> usuario.id
  );

UPDATE usuarios usuario
SET indicado_por_id = convite.indicador_id
FROM roleta_convites convite
WHERE convite.indicado_id = usuario.id
  AND usuario.indicado_por_id IS NULL
  AND convite.indicador_id <> usuario.id;
