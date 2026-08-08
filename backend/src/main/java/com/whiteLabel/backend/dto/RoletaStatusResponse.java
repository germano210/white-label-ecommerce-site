package com.whiteLabel.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record RoletaStatusResponse(
        String logoUrl,
        List<RoletaNotificacaoResponse> notificacoes,
        Integer girosTotaisObtidos,
        Integer girosDisponiveis,
        BigDecimal valorDisponivelResgate,
        BigDecimal valorTotalResgatado,
        Integer metaGrupo,
        Integer progressoGrupo,
        Integer girosBonusGrupo,
        String codigoConvite,
        String urlConvite,
        Long convitesConvertidos,
        Integer girosPorConvite,
        Boolean ativa,
        String titulo,
        Boolean giroDiarioDisponivel,
        LocalDateTime proximoGiroDiarioEm,
        RoletaPremioResponse premioPendente,
        List<String> ultimosEventos,
        List<RoletaPremioFaixaResponse> premiosEmJogo
) {
}
