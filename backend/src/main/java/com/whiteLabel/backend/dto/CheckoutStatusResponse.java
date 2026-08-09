package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.Pagamento;
import com.whiteLabel.backend.domain.PagamentoStatus;
import com.whiteLabel.backend.domain.Pedido;
import com.whiteLabel.backend.domain.PedidoStatus;

import java.math.BigDecimal;

public record CheckoutStatusResponse(
        Long pedidoId,
        String status,
        String pagamentoStatus,
        BigDecimal valorTotal,
        BigDecimal precoFinal
) {

    public static CheckoutStatusResponse from(Pedido pedido, Pagamento pagamento) {
        return new CheckoutStatusResponse(
                pedido.getId(),
                normalizarPedidoStatus(pedido.getStatus()),
                pagamento == null
                        ? normalizarPagamentoStatus(PagamentoStatus.PENDENTE)
                        : normalizarPagamentoStatus(pagamento.getStatus()),
                pedido.getValorTotal(),
                pedido.getPrecoFinal()
        );
    }

    private static String normalizarPedidoStatus(PedidoStatus status) {
        if (status == PedidoStatus.AGUARDANDO_PAGAMENTO) {
            return PedidoStatus.PENDENTE.name();
        }

        return status == null ? PedidoStatus.PENDENTE.name() : status.name();
    }

    private static String normalizarPagamentoStatus(PagamentoStatus status) {
        if (status == PagamentoStatus.AGUARDANDO_PAGAMENTO) {
            return PagamentoStatus.PENDENTE.name();
        }

        return status == null ? PagamentoStatus.PENDENTE.name() : status.name();
    }
}
