package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.Produto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record AdminProdutoResponseDTO(
        Long id,
        String nome,
        BigDecimal precoVenda,
        BigDecimal precoAntigo,
        BigDecimal precoCusto,
        String imagemUrl,
        String tamanho,
        BigDecimal condicao,
        LocalDateTime criadoEm,
        Integer curtidasCount,
        Integer passosCount,
        List<String> nomesCurtidas,
        List<ProdutoImagemResponse> imagens
) {

    public static AdminProdutoResponseDTO from(
            Produto produto,
            List<String> nomesCurtidas,
            List<ProdutoImagemResponse> imagens
    ) {
        return new AdminProdutoResponseDTO(
                produto.getId(),
                produto.getNome(),
                produto.getPrecoVenda(),
                produto.getPrecoAntigo(),
                produto.getPrecoCusto(),
                produto.getImagemUrl(),
                produto.getTamanho(),
                produto.getCondicao() == null ? BigDecimal.ZERO : produto.getCondicao(),
                produto.getCriadoEm(),
                produto.getCurtidasCount() == null ? 0 : produto.getCurtidasCount(),
                produto.getPassosCount() == null ? 0 : produto.getPassosCount(),
                nomesCurtidas == null ? List.of() : nomesCurtidas,
                imagens == null ? List.of() : imagens
        );
    }
}
