package com.whiteLabel.backend.dto;

import jakarta.validation.constraints.Size;

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
        List<Long> produtoIds
) {
}
