package com.whiteLabel.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record AdminRoletaNivelRequest(
        Long id,
        @Size(max = 120) String nome,
        @Size(max = 500) String descricao,
        @Pattern(regexp = "^#[0-9a-fA-F]{6}$") String corHex,
        Integer ordem,
        @DecimalMin(value = "0.00000001") BigDecimal pesoRelativo,
        Boolean ativo
) {
}
