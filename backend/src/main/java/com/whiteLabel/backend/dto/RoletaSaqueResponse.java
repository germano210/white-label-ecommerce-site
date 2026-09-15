package com.whiteLabel.backend.dto;

import java.math.BigDecimal;

public record RoletaSaqueResponse(
        BigDecimal valorSacado,
        BigDecimal valorDisponivelResgate,
        BigDecimal valorTotalResgatado,
        RoletaStatusResponse roleta
) {
}
