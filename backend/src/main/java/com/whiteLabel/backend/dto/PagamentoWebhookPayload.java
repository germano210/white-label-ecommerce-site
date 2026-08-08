package com.whiteLabel.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.whiteLabel.backend.domain.PagamentoStatus;

public record PagamentoWebhookPayload(
        @JsonAlias("event_id")
        String eventId,

        @JsonAlias("payment_id")
        String paymentId,

        @JsonAlias({"checkout_id", "order_nsu", "orderNsu"})
        String checkoutId,

        PagamentoStatus status
) {
}
