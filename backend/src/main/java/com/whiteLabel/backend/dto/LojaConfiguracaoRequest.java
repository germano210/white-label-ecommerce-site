package com.whiteLabel.backend.dto;

import jakarta.validation.constraints.NotNull;

public record LojaConfiguracaoRequest(
        @NotNull Integer condicaoCasasDecimais
) {
}
