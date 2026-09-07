package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.RoletaMeta;

import java.time.LocalDateTime;

public record RoletaMetaResponse(
        Long id,
        String titulo,
        String descricao,
        Integer quantidadeAlvo,
        Integer girosRecompensa,
        Integer progressoAtual,
        Integer ordem,
        Boolean ativa,
        String status,
        LocalDateTime criadaEm,
        LocalDateTime atualizadaEm,
        LocalDateTime iniciadaEm,
        LocalDateTime concluidaEm
) {

    public static RoletaMetaResponse from(RoletaMeta meta) {
        return new RoletaMetaResponse(
                meta.getId(),
                meta.getTitulo(),
                meta.getDescricao(),
                meta.getQuantidadeAlvo(),
                meta.getGirosRecompensa(),
                meta.getProgressoAtual(),
                meta.getOrdem(),
                meta.getAtiva(),
                meta.getStatus().name(),
                meta.getCriadaEm(),
                meta.getAtualizadaEm(),
                meta.getIniciadaEm(),
                meta.getConcluidaEm()
        );
    }
}
