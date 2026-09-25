package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.RoletaGiro;
import com.whiteLabel.backend.domain.RoletaGiroVisitante;
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

    public static RoletaPremioResponse from(RoletaGiroVisitante giro) {
        if (giro == null) {
            return null;
        }

        BigDecimal valor = giro.getValorPremio();
        RoletaTipoPremio tipoPremio = giro.getTipoPremio();

        return new RoletaPremioResponse(
                giro.getId(),
                tipoPremio == RoletaTipoPremio.DESCONTO_VALOR ? valor : BigDecimal.ZERO,
                formatarPremio(tipoPremio, valor, tituloVisitante(giro)),
                giro.getStatus().name(),
                giro.getCriadoEm(),
                tipoPremio.name(),
                tituloVisitante(giro),
                giro.getPremio() == null ? null : giro.getPremio().getDescricao(),
                valor,
                tipoPremio == RoletaTipoPremio.GIRO_EXTRA ? Math.max(1, valor.intValue()) : 0,
                giro.getPremio() == null ? null : giro.getPremio().getId(),
                giro.getNivel() == null ? null : giro.getNivel().getId(),
                giro.getNivelNomeSnapshot(),
                giro.getNivelCorHex()
        );
    }

    private static String formatarPremio(RoletaGiro giro) {
        return formatarPremio(giro.getTipoPremio(), giro.getValorPremio(), giro.getTituloPremio());
    }

    private static String formatarPremio(
            RoletaTipoPremio tipoPremio,
            BigDecimal valorPremio,
            String tituloPremio
    ) {
        if (tipoPremio == RoletaTipoPremio.DESCONTO_PERCENTUAL) {
            return "-" + formatDecimal(valorPremio) + "% na loja";
        }
        if (tipoPremio == RoletaTipoPremio.GIRO_EXTRA) {
            int giros = Math.max(1, valorPremio == null ? 0 : valorPremio.intValue());
            return "+" + giros + (giros == 1 ? " giro" : " giros");
        }
        if (tipoPremio == RoletaTipoPremio.SEM_PREMIO) {
            return tituloPremio == null ? "Sem premio" : tituloPremio;
        }
        return "-" + formatMoney(valorPremio);
    }

    private static String tituloVisitante(RoletaGiroVisitante giro) {
        if (giro.getPremio() != null && giro.getPremio().getTitulo() != null) {
            return giro.getPremio().getTitulo();
        }
        if (giro.getTipoPremio() == RoletaTipoPremio.DESCONTO_PERCENTUAL) {
            return formatDecimal(giro.getValorPremio()) + "% OFF";
        }
        if (giro.getTipoPremio() == RoletaTipoPremio.GIRO_EXTRA) {
            int giros = Math.max(1, giro.getValorPremio().intValue());
            return "+" + giros + (giros == 1 ? " giro" : " giros");
        }
        if (giro.getTipoPremio() == RoletaTipoPremio.SEM_PREMIO) {
            return "Sem premio";
        }
        return "R$ " + giro.getValorPremio().setScale(2).toPlainString().replace('.', ',') + " OFF";
    }

    private static String formatMoney(BigDecimal valor) {
        return NumberFormat.getCurrencyInstance(Locale.of("pt", "BR")).format(valor);
    }

    private static String formatDecimal(BigDecimal valor) {
        return valor.stripTrailingZeros().toPlainString();
    }
}
