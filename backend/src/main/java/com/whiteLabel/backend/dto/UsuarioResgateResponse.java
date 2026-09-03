package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.Pagamento;
import com.whiteLabel.backend.domain.Pedido;
import com.whiteLabel.backend.domain.PedidoItem;
import com.whiteLabel.backend.domain.Produto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record UsuarioResgateResponse(
        Long pedidoId,
        Long produtoId,
        String nomeProduto,
        String imagemUrl,
        String tamanho,
        BigDecimal valorOriginal,
        BigDecimal descontoAplicado,
        BigDecimal valorPago,
        String statusPedido,
        String statusPagamento,
        LocalDateTime criadoEm,
        LocalDateTime pagoEm
) {

    public static UsuarioResgateResponse from(Pedido pedido, PedidoItem item, Pagamento pagamento) {
        Produto produto = item.getProduto();
        boolean pago = pagamento != null && pagamento.getStatus() != null
                && "PAGO".equals(pagamento.getStatus().name());

        return new UsuarioResgateResponse(
                pedido.getId(),
                produto.getId(),
                produto.getNome(),
                produto.getImagemUrl(),
                produto.getTamanho(),
                pedido.getPrecoOriginal(),
                pedido.getDescontoAplicado(),
                item.getSubtotal(),
                pedido.getStatus().name(),
                pagamento == null ? pedido.getStatus().name() : pagamento.getStatus().name(),
                pedido.getDataCriacao(),
                pago ? pagamento.getDataAtualizacao() : null
        );
    }
}
