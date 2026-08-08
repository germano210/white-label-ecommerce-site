package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.RoletaOpcao;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AdminRoletaOpcaoResponse(
        Long id,
        Integer nivel,
        String titulo,
        String descricao,
        String tipoPremio,
        BigDecimal valorMinimo,
        BigDecimal valorMaximo,
        Integer peso,
        Boolean ativa,
        Integer ordem,
        LocalDateTime criadaEm,
        LocalDateTime atualizadaEm
) {

    public static AdminRoletaOpcaoResponse from(RoletaOpcao opcao) {
        return new AdminRoletaOpcaoResponse(
                opcao.getId(),
                opcao.getNivel(),
                opcao.getTitulo(),
                opcao.getDescricao(),
                opcao.getTipoPremio().name(),
                opcao.getValorMinimo(),
                opcao.getValorMaximo(),
                opcao.getPeso(),
                opcao.getAtiva(),
                opcao.getOrdem(),
                opcao.getCriadaEm(),
                opcao.getAtualizadaEm()
        );
    }
}
