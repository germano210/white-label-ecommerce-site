package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.RoletaInteracao;

import java.time.LocalDateTime;

public record RoletaNotificacaoResponse(
        Long id,
        String tipo,
        String texto,
        LocalDateTime criadoEm,
        String usuarioNome,
        String usuarioSecundarioNome,
        String produtoNome,
        String nivelNome,
        String nivelCorHex
) {

    public static RoletaNotificacaoResponse from(RoletaInteracao interacao) {
        return new RoletaNotificacaoResponse(
                interacao.getId(),
                interacao.getTipo().name(),
                interacao.getTextoSnapshot(),
                interacao.getCriadoEm(),
                interacao.getUsuarioNomeSnapshot(),
                interacao.getUsuarioSecundarioNomeSnapshot(),
                interacao.getProdutoNomeSnapshot(),
                interacao.getNivelNomeSnapshot(),
                interacao.getNivelCorHex()
        );
    }
}
