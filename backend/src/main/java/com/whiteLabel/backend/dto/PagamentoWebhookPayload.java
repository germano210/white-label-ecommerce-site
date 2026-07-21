package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.PagamentoStatus;

public record PagamentoWebhookPayload(
        String eventId,
        String paymentId,
        String checkoutId,
        PagamentoStatus status
) {
}
