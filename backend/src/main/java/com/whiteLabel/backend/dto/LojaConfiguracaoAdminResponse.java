package com.whiteLabel.backend.dto;

import java.time.LocalDateTime;

public record LojaConfiguracaoAdminResponse(
        Integer condicaoCasasDecimais,
        LocalDateTime atualizadaEm
) {
}
