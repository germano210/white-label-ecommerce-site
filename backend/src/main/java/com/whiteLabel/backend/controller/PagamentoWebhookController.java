package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.dto.PagamentoWebhookResponse;
import com.whiteLabel.backend.service.PagamentoWebhookService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pagamentos")
public class PagamentoWebhookController {

    private final PagamentoWebhookService pagamentoWebhookService;

    public PagamentoWebhookController(PagamentoWebhookService pagamentoWebhookService) {
        this.pagamentoWebhookService = pagamentoWebhookService;
    }

    @PostMapping("/webhook")
    public PagamentoWebhookResponse receberWebhook(
            @RequestBody String payload,
            @RequestHeader(name = "X-Payment-Signature", required = false) String assinatura
    ) {
        return pagamentoWebhookService.processar(payload, assinatura);
    }
}
