package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.RoletaTipoPremio;
import jakarta.validation.constraints.DecimalMin;

import java.math.BigDecimal;

public record AdminRoletaPremioRequest(
        Long id,
        Long nivelId,
        RoletaTipoPremio tipoPremio,
        @DecimalMin(value = "0.01") BigDecimal valor,
        Integer ordem,
        Boolean ativo
) {
}
