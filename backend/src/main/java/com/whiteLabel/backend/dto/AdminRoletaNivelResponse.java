package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.RoletaNivel;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record AdminRoletaNivelResponse(
        Long id,
        String nome,
        String descricao,
        String corHex,
        Integer ordem,
        BigDecimal pesoRelativo,
        BigDecimal chancePercentual,
        Boolean ativo,
        List<AdminRoletaPremioResponse> premios,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {

    public static AdminRoletaNivelResponse from(RoletaNivel nivel, BigDecimal chancePercentual) {
        return from(nivel, chancePercentual, List.of());
    }

    public static AdminRoletaNivelResponse from(
            RoletaNivel nivel,
            BigDecimal chancePercentual,
            List<AdminRoletaPremioResponse> premios
    ) {
        return new AdminRoletaNivelResponse(
                nivel.getId(),
                nivel.getNome(),
                nivel.getDescricao(),
                nivel.getCorHex(),
                nivel.getOrdem(),
                pesoRelativoParaResposta(nivel.getPesoRelativo()),
                chancePercentual,
                nivel.getAtivo(),
                premios == null ? List.of() : premios,
                nivel.getCriadoEm(),
                nivel.getAtualizadoEm()
        );
    }

    private static BigDecimal pesoRelativoParaResposta(BigDecimal pesoRelativo) {
        BigDecimal peso = pesoRelativo == null ? BigDecimal.ONE : pesoRelativo.stripTrailingZeros();
        return peso.scale() < 0 ? peso.setScale(0) : peso;
    }
}
