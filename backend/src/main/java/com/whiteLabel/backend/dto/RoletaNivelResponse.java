package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.RoletaNivel;

import java.math.BigDecimal;

public record RoletaNivelResponse(
        Long id,
        String nome,
        String descricao,
        String corHex,
        Integer ordem,
        BigDecimal chancePercentual,
        Long quantidadePremiosAtivos,
        Boolean ativo
) {

    public static RoletaNivelResponse from(RoletaNivel nivel, BigDecimal chancePercentual) {
        return from(nivel, chancePercentual, 0L);
    }

    public static RoletaNivelResponse from(
            RoletaNivel nivel,
            BigDecimal chancePercentual,
            Long quantidadePremiosAtivos
    ) {
        return new RoletaNivelResponse(
                nivel.getId(),
                nivel.getNome(),
                nivel.getDescricao(),
                nivel.getCorHex(),
                nivel.getOrdem(),
                chancePercentual,
                quantidadePremiosAtivos == null ? 0L : quantidadePremiosAtivos,
                nivel.getAtivo()
        );
    }
}
