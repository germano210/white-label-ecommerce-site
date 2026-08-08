package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.RoletaGiro;
import com.whiteLabel.backend.domain.RoletaTipoPremio;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.util.Locale;

public record RoletaPremioResponse(
        Long id,
        BigDecimal valorDesconto,
        String valorFormatado,
        String status,
        LocalDateTime criadoEm,
        String tipoPremio,
        String titulo,
        String descricao,
        BigDecimal valorPremio,
        Integer girosExtras,
        Long premioConfiguradoId,
        Long nivelId,
        String nivelNome,
        String corNivel
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
                formatarPremio(giro),
                giro.getStatus().name(),
                giro.getCriadoEm(),
                giro.getTipoPremio().name(),
                giro.getTituloPremio(),
                giro.getDescricaoPremio(),
                giro.getValorPremio(),
                giro.getGirosExtras(),
                giro.getPremio() == null ? null : giro.getPremio().getId(),
                giro.getNivel() == null ? null : giro.getNivel().getId(),
                giro.getNivel() == null ? null : giro.getNivel().getNome(),
                giro.getNivel() == null ? null : giro.getNivel().getCorHex()
        );
    }

    private static String formatarPremio(RoletaGiro giro) {
        RoletaTipoPremio tipoPremio = giro.getTipoPremio();
        if (tipoPremio == RoletaTipoPremio.DESCONTO_PERCENTUAL) {
            return "-" + formatDecimal(giro.getValorPremio()) + "% na loja";
        }
        if (tipoPremio == RoletaTipoPremio.GIRO_EXTRA) {
            int giros = giro.getGirosExtras();
            return "+" + giros + (giros == 1 ? " giro" : " giros");
        }
        if (tipoPremio == RoletaTipoPremio.SEM_PREMIO) {
            return giro.getTituloPremio() == null ? "Sem premio" : giro.getTituloPremio();
        }
        return "-" + formatMoney(giro.getValorPremio());
    }

    private static String formatMoney(BigDecimal valor) {
        return NumberFormat.getCurrencyInstance(Locale.of("pt", "BR")).format(valor);
    }

    private static String formatDecimal(BigDecimal valor) {
        return valor.stripTrailingZeros().toPlainString();
    }
}
