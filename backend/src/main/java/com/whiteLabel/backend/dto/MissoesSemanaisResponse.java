package com.whiteLabel.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record MissoesSemanaisResponse(
        LocalDateTime resetAt,
        List<MissaoSemanalResponse> missoes,
        Boolean podeResgatarTentativas,
        Integer tentativasRecompensa,
        Integer xpRecompensa
) {
}
