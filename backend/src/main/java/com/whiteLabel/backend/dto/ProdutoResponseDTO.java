package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.Produto;
import com.whiteLabel.backend.domain.ProdutoStatus;

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
        BigDecimal condicao,
        LocalDateTime criadoEm,
        Integer curtidasCount,
        Integer passosCount,
        List<String> nomesCurtidas,
        List<ProdutoImagemResponse> imagens,
        String status,
        Boolean reservado,
        Boolean reservadoPorMim,
        LocalDateTime reservadoAte,
        Long pedidoId,
        String checkoutId,
        String checkoutUrl
) {

    public static ProdutoResponseDTO from(Produto produto) {
        return from(produto, List.of());
    }

    public static ProdutoResponseDTO from(Produto produto, List<String> nomesCurtidas) {
        return from(produto, nomesCurtidas, imagensLegadas(produto));
    }

    public static ProdutoResponseDTO from(Produto produto, ProdutoReservaInfo reservaInfo) {
        return from(produto, List.of(), imagensLegadas(produto), reservaInfo);
    }

    public static ProdutoResponseDTO from(
            Produto produto,
            List<String> nomesCurtidas,
            List<ProdutoImagemResponse> imagens
    ) {
        return from(produto, nomesCurtidas, imagens, null);
    }

    public static ProdutoResponseDTO from(
            Produto produto,
            List<String> nomesCurtidas,
            List<ProdutoImagemResponse> imagens,
            ProdutoReservaInfo reservaInfo
    ) {
        ProdutoReservaInfo info = reservaInfo == null
                ? new ProdutoReservaInfo(
                        produto.getStatus() == null
                                ? ProdutoStatus.DISPONIVEL.name()
                                : produto.getStatus().name(),
                        false,
                        false,
                        null,
                        null,
                        null,
                        null
                )
                : reservaInfo;

        return new ProdutoResponseDTO(
                produto.getId(),
                produto.getNome(),
                produto.getPrecoVenda(),
                produto.getPrecoAntigo(),
                produto.getImagemUrl(),
                produto.getTamanho(),
                produto.getCondicao() == null ? BigDecimal.ZERO : produto.getCondicao(),
                produto.getCriadoEm(),
                produto.getCurtidasCount() == null ? 0 : produto.getCurtidasCount(),
                produto.getPassosCount() == null ? 0 : produto.getPassosCount(),
                nomesCurtidas == null ? List.of() : nomesCurtidas,
                imagens == null ? List.of() : imagens,
                info.status(),
                info.reservado(),
                info.reservadoPorMim(),
                info.reservadoAte(),
                info.pedidoId(),
                info.checkoutId(),
                info.checkoutUrl()
        );
    }

    private static List<ProdutoImagemResponse> imagensLegadas(Produto produto) {
        if (produto.getImagemUrl() == null || produto.getImagemUrl().isBlank()) {
            return List.of();
        }

        return List.of(ProdutoImagemResponse.legada(produto.getImagemUrl()));
    }
}
