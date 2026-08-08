package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.RoletaPremio;

import java.math.BigDecimal;

public record RoletaPremioConfiguradoResponse(
        Long id,
        Long nivelId,
        String nivelNome,
        String titulo,
        String descricao,
        String tipoPremio,
        BigDecimal valor,
        Integer ordem,
        Boolean ativo
) {

    public static RoletaPremioConfiguradoResponse from(RoletaPremio premio) {
        return new RoletaPremioConfiguradoResponse(
                premio.getId(),
                premio.getNivel().getId(),
                premio.getNivel().getNome(),
                premio.getTitulo(),
                premio.getDescricao(),
                premio.getTipoPremio().name(),
                premio.getValor(),
                premio.getOrdem(),
                premio.getAtivo()
        );
    }
}
