package com.whiteLabel.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record AdminRoletaRequest(
        Boolean ativa,
        @Size(max = 120) String titulo,
        Integer metaGrupo,
        Integer girosBonusGrupo,
        Integer girosIniciais,
        Integer giroDiarioQuantidade,
        Boolean giroDiarioSomenteQuandoZerar,
        Integer girosGanhosPorConvite,
        BigDecimal multiplicadorDificuldadePadrao,
        Boolean usarPesosManuais,
        List<Long> produtoIds,
        List<@Valid AdminRoletaNivelRequest> niveis,
        List<@Valid AdminRoletaOpcaoRequest> opcoes,
        List<@Valid AdminRoletaPremioRequest> premios
) {
}
