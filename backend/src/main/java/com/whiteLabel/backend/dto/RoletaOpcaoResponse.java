package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.RoletaOpcao;

import java.math.BigDecimal;

public record RoletaOpcaoResponse(
        Long id,
        Integer nivel,
        String titulo,
        String descricao,
        String tipoPremio,
        BigDecimal valorMinimo,
        BigDecimal valorMaximo,
        Integer ordem,
        Boolean ativa
) {

    public static RoletaOpcaoResponse from(RoletaOpcao opcao) {
        return new RoletaOpcaoResponse(
                opcao.getId(),
                opcao.getNivel(),
                opcao.getTitulo(),
                opcao.getDescricao(),
                opcao.getTipoPremio().name(),
                opcao.getValorMinimo(),
                opcao.getValorMaximo(),
                opcao.getOrdem(),
                opcao.getAtiva()
        );
    }
}
