package com.whiteLabel.backend.dto;

import java.time.LocalDateTime;

public record IndicacaoAberturaResponse(
        String codigo,
        String status,
        LocalDateTime abertoEm
) {
}
