package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.RoletaPremio;

import java.math.BigDecimal;

public record AdminRoletaPremioResponse(
        Long id,
        Long nivelId,
        String tipoPremio,
        BigDecimal valor,
        Integer ordem,
        Boolean ativo,
        String titulo
) {

    public static AdminRoletaPremioResponse from(RoletaPremio premio) {
        return new AdminRoletaPremioResponse(
                premio.getId(),
                premio.getNivel().getId(),
                premio.getTipoPremio().name(),
                premio.getValor(),
                premio.getOrdem(),
                premio.getAtivo(),
                premio.getTitulo()
        );
    }
}
