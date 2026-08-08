package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.RoletaPremio;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AdminRoletaPremioResponse(
        Long id,
        Long nivelId,
        String nivelNome,
        String titulo,
        String descricao,
        String tipoPremio,
        BigDecimal valor,
        BigDecimal pesoInterno,
        Integer ordem,
        Boolean ativo,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {

    public static AdminRoletaPremioResponse from(RoletaPremio premio) {
        return new AdminRoletaPremioResponse(
                premio.getId(),
                premio.getNivel().getId(),
                premio.getNivel().getNome(),
                premio.getTitulo(),
                premio.getDescricao(),
                premio.getTipoPremio().name(),
                premio.getValor(),
                premio.getPesoInterno(),
                premio.getOrdem(),
                premio.getAtivo(),
                premio.getCriadoEm(),
                premio.getAtualizadoEm()
        );
    }
}
