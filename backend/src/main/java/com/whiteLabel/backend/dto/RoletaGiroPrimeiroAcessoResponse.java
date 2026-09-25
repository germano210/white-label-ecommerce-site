package com.whiteLabel.backend.dto;

import java.time.LocalDateTime;

public record RoletaGiroPrimeiroAcessoResponse(
        String token,
        RoletaPremioResponse premio,
        RoletaNivelResponse nivelSorteado,
        String nivelCorHex,
        LocalDateTime expiraEm,
        RoletaStatusResponse roleta
) {
}
