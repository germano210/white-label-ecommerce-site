package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.RoletaTipoPremio;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record AdminRoletaPremioRequest(
        Long id,
        Long nivelId,
        @Size(max = 120) String titulo,
        @Size(max = 500) String descricao,
        RoletaTipoPremio tipoPremio,
        @DecimalMin(value = "0.00") BigDecimal valor,
        @DecimalMin(value = "0.00") BigDecimal pesoInterno,
        Integer ordem,
        Boolean ativo
) {
}
