package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.ProdutoImagem;

public record ProdutoImagemResponse(
        Long id,
        String url,
        Integer ordem,
        Boolean principal
) {

    public static ProdutoImagemResponse from(ProdutoImagem imagem) {
        return new ProdutoImagemResponse(
                imagem.getId(),
                imagem.getUrl(),
                imagem.getOrdem(),
                imagem.getPrincipal()
        );
    }

    public static ProdutoImagemResponse legada(String url) {
        return new ProdutoImagemResponse(null, url, 0, true);
    }
}
