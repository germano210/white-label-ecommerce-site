package com.whiteLabel.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record AdminRoletaResponse(
        Boolean ativa,
        String titulo,
        Integer metaGrupo,
        Integer progressoGrupo,
        Integer girosBonusGrupo,
        Integer girosIniciais,
        Integer giroDiarioQuantidade,
        Boolean giroDiarioSomenteQuandoZerar,
        Integer girosGanhosPorConvite,
        BigDecimal multiplicadorDificuldadePadrao,
        Boolean usarPesosManuais,
        LocalDateTime atualizadaEm,
        List<Long> produtoIds,
        List<ProdutoResponseDTO> produtos,
        List<AdminRoletaNivelResponse> niveis,
        List<AdminRoletaOpcaoResponse> opcoes,
        List<AdminRoletaPremioResponse> premios
) {
}
