package com.whiteLabel.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record RoletaStatusResponse(
        Boolean ativa,
        String titulo,
        Integer metaGrupo,
        Integer progressoGrupo,
        Integer girosBonusGrupo,
        Integer girosDisponiveis,
        Boolean giroDiarioDisponivel,
        LocalDateTime proximoGiroDiarioEm,
        RoletaPremioResponse premioPendente,
        List<String> ultimosEventos,
        List<RoletaPremioFaixaResponse> premiosEmJogo
) {
}
