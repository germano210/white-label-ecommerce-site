package com.whiteLabel.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ResgateTentativasResponse(
        Integer tentativasConcedidas,
        Integer tentativasSaldo,
        LocalDateTime resetAt,
        List<MissaoSemanalResponse> missoes
) {
}
