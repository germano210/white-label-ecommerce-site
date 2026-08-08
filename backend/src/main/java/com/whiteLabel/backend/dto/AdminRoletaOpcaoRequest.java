package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.RoletaTipoPremio;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record AdminRoletaOpcaoRequest(
        Long id,
        @NotNull Integer nivel,
        @NotBlank @Size(max = 120) String titulo,
        @Size(max = 500) String descricao,
        @NotNull RoletaTipoPremio tipoPremio,
        @DecimalMin(value = "0.00") BigDecimal valorMinimo,
        @DecimalMin(value = "0.00") BigDecimal valorMaximo,
        @Min(0) Integer peso,
        Boolean ativa,
        Integer ordem
) {
}
