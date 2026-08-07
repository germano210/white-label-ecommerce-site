package com.whiteLabel.backend.dto;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

public record RoletaPremioFaixaResponse(
        BigDecimal minimo,
        BigDecimal maximo,
        String label
) {

    public static RoletaPremioFaixaResponse from(BigDecimal minimo, BigDecimal maximo) {
        return new RoletaPremioFaixaResponse(
                minimo,
                maximo,
                "-" + formatMoney(minimo) + " / -" + formatMoney(maximo)
                        + " na loja"
        );
    }

    private static String formatMoney(BigDecimal valor) {
        return NumberFormat.getCurrencyInstance(Locale.of("pt", "BR")).format(valor);
    }
}
