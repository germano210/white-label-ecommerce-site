package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.Pagamento;

import java.math.BigDecimal;

public record CheckoutResponse(
        Long pedidoId,
        String checkoutId,
        String checkoutUrl,
        String status,
        BigDecimal valorTotal
) {

    public static CheckoutResponse from(Pagamento pagamento, String checkoutUrl) {
        return new CheckoutResponse(
                pagamento.getPedido().getId(),
                pagamento.getCheckoutId(),
                checkoutUrl,
                pagamento.getPedido().getStatus().name(),
                pagamento.getPedido().getValorTotal()
        );
    }
}
