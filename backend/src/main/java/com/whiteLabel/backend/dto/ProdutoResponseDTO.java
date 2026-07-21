package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.Produto;

import java.math.BigDecimal;
import java.util.List;

public record ProdutoResponseDTO(
        Long id,
        String nome,
        BigDecimal precoVenda,
        BigDecimal precoAntigo,
        String imagemUrl,
        String tamanho,
        Integer curtidasCount,
        Integer passosCount,
        List<String> nomesCurtidas
) {

    public static ProdutoResponseDTO from(Produto produto) {
        return from(produto, List.of());
    }

    public static ProdutoResponseDTO from(Produto produto, List<String> nomesCurtidas) {
        return new ProdutoResponseDTO(
                produto.getId(),
                produto.getNome(),
                produto.getPrecoVenda(),
                produto.getPrecoAntigo(),
                produto.getImagemUrl(),
                produto.getTamanho(),
                produto.getCurtidasCount() == null ? 0 : produto.getCurtidasCount(),
                produto.getPassosCount() == null ? 0 : produto.getPassosCount(),
                nomesCurtidas
        );
    }
}
