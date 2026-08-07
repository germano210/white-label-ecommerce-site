package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.RoletaGiro;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.util.Locale;

public record RoletaPremioResponse(
        Long id,
        BigDecimal valorDesconto,
        String valorFormatado,
        String status,
        LocalDateTime criadoEm
) {

    public static RoletaPremioResponse from(RoletaGiro giro) {
        if (giro == null) {
            return null;
        }

        BigDecimal valor = giro.getValorDesconto() == null
                ? BigDecimal.ZERO
                : giro.getValorDesconto();

        return new RoletaPremioResponse(
                giro.getId(),
                valor,
                "-" + formatMoney(valor),
                giro.getStatus().name(),
                giro.getCriadoEm()
        );
    }

    private static String formatMoney(BigDecimal valor) {
        return NumberFormat.getCurrencyInstance(Locale.of("pt", "BR")).format(valor);
    }
}
