package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.Produto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ProdutoResponseDTO(
        Long id,
        String nome,
        BigDecimal precoVenda,
        BigDecimal precoAntigo,
        String imagemUrl,
        String tamanho,
        LocalDateTime criadoEm,
        Integer curtidasCount,
        Integer passosCount,
        List<String> nomesCurtidas,
        List<ProdutoImagemResponse> imagens
) {

    public static ProdutoResponseDTO from(Produto produto) {
        return from(produto, List.of());
    }

    public static ProdutoResponseDTO from(Produto produto, List<String> nomesCurtidas) {
        return from(produto, nomesCurtidas, imagensLegadas(produto));
    }

    public static ProdutoResponseDTO from(
            Produto produto,
            List<String> nomesCurtidas,
            List<ProdutoImagemResponse> imagens
    ) {
        return new ProdutoResponseDTO(
                produto.getId(),
                produto.getNome(),
                produto.getPrecoVenda(),
                produto.getPrecoAntigo(),
                produto.getImagemUrl(),
                produto.getTamanho(),
                produto.getCriadoEm(),
                produto.getCurtidasCount() == null ? 0 : produto.getCurtidasCount(),
                produto.getPassosCount() == null ? 0 : produto.getPassosCount(),
                nomesCurtidas == null ? List.of() : nomesCurtidas,
                imagens == null ? List.of() : imagens
        );
    }

    private static List<ProdutoImagemResponse> imagensLegadas(Produto produto) {
        if (produto.getImagemUrl() == null || produto.getImagemUrl().isBlank()) {
            return List.of();
        }

        return List.of(ProdutoImagemResponse.legada(produto.getImagemUrl()));
    }
}
