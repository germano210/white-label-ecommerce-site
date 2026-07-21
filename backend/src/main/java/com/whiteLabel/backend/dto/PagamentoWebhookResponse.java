package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.Pagamento;

public record PagamentoWebhookResponse(
        String eventId,
        String paymentId,
        Long pedidoId,
        String status,
        Boolean duplicado
) {

    public static PagamentoWebhookResponse from(Pagamento pagamento, Boolean duplicado) {
        return new PagamentoWebhookResponse(
                pagamento.getEventId(),
                pagamento.getPaymentId(),
                pagamento.getPedido().getId(),
                pagamento.getPedido().getStatus().name(),
                duplicado
        );
    }
}
