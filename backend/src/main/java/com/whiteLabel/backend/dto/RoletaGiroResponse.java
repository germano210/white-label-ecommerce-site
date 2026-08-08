package com.whiteLabel.backend.dto;

import java.math.BigDecimal;

public record RoletaGiroResponse(
        RoletaPremioResponse premio,
        RoletaPremioResponse premioSorteado,
        RoletaOpcaoResponse opcaoSorteada,
        RoletaNivelResponse nivelSorteado,
        String corNivel,
        RoletaPremioConfiguradoResponse premioConfiguradoSorteado,
        BigDecimal valor,
        Integer girosDisponiveis,
        RoletaStatusResponse roleta
) {
}
