package com.whiteLabel.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.whiteLabel.backend.domain.Pagamento;
import com.whiteLabel.backend.domain.PagamentoStatus;
import com.whiteLabel.backend.domain.Pedido;
import com.whiteLabel.backend.dto.PagamentoWebhookPayload;
import com.whiteLabel.backend.dto.PagamentoWebhookResponse;
import com.whiteLabel.backend.repository.PagamentoRepository;
import com.whiteLabel.backend.repository.PedidoRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

@Service
public class PagamentoWebhookService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final PagamentoRepository pagamentoRepository;
    private final PedidoRepository pedidoRepository;
    private final ObjectMapper objectMapper;
    private final String webhookSecret;

    public PagamentoWebhookService(
            PagamentoRepository pagamentoRepository,
            PedidoRepository pedidoRepository,
            ObjectMapper objectMapper,
            @Value("${payment.webhook-secret}") String webhookSecret
    ) {
        this.pagamentoRepository = pagamentoRepository;
        this.pedidoRepository = pedidoRepository;
        this.objectMapper = objectMapper;
        this.webhookSecret = webhookSecret;
    }

    @Transactional
    public PagamentoWebhookResponse processar(String payload, String assinatura) {
        if (!assinaturaValida(payload, assinatura)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Webhook invalido");
        }

        PagamentoWebhookPayload evento = lerEvento(payload);
        validarEvento(evento);

        var pagamentoPorEvento = pagamentoRepository.findByEventId(evento.eventId());
        if (pagamentoPorEvento.isPresent()) {
            return PagamentoWebhookResponse.from(pagamentoPorEvento.get(), true);
        }

        Pagamento pagamento = buscarPagamento(evento);
        if (pagamento.getPaymentId() != null
                && pagamento.getPaymentId().equals(evento.paymentId())) {
            return PagamentoWebhookResponse.from(pagamento, true);
        }

        pagamento.registrarWebhook(evento.eventId(), evento.paymentId(), evento.status());
        atualizarPedido(pagamento.getPedido(), evento.status());

        pedidoRepository.save(pagamento.getPedido());
        Pagamento pagamentoAtualizado = pagamentoRepository.save(pagamento);

        return PagamentoWebhookResponse.from(pagamentoAtualizado, false);
    }

    private Pagamento buscarPagamento(PagamentoWebhookPayload evento) {
        if (evento.paymentId() != null && !evento.paymentId().isBlank()) {
            var porPaymentId = pagamentoRepository.findByPaymentId(evento.paymentId());

            if (porPaymentId.isPresent()) {
                return porPaymentId.get();
            }
        }

        return pagamentoRepository.findByCheckoutId(evento.checkoutId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Pagamento nao encontrado"
                ));
    }

    private void atualizarPedido(Pedido pedido, PagamentoStatus status) {
        if (status == PagamentoStatus.PAGO) {
            pedido.marcarPago();
            return;
        }

        if (status == PagamentoStatus.FALHOU) {
            pedido.marcarFalha();
            return;
        }

        if (status == PagamentoStatus.CANCELADO) {
            pedido.cancelar();
        }
    }

    private PagamentoWebhookPayload lerEvento(String payload) {
        try {
            return objectMapper.readValue(payload, PagamentoWebhookPayload.class);
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Payload de webhook invalido",
                    exception
            );
        }
    }

    private void validarEvento(PagamentoWebhookPayload evento) {
        if (evento.eventId() == null || evento.eventId().isBlank()
                || evento.checkoutId() == null || evento.checkoutId().isBlank()
                || evento.status() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Webhook sem identificadores obrigatorios"
            );
        }
    }

    private boolean assinaturaValida(String payload, String assinatura) {
        if (assinatura == null || assinatura.isBlank() || webhookSecret == null
                || webhookSecret.isBlank()) {
            return false;
        }

        String assinaturaEsperada = calcularHmac(payload);
        String assinaturaRecebida = assinatura.trim();

        if (assinaturaRecebida.startsWith("sha256=")) {
            assinaturaRecebida = assinaturaRecebida.substring("sha256=".length());
        }

        return MessageDigest.isEqual(
                assinaturaEsperada.getBytes(StandardCharsets.UTF_8),
                assinaturaRecebida.getBytes(StandardCharsets.UTF_8)
        );
    }

    private String calcularHmac(String payload) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(
                    webhookSecret.getBytes(StandardCharsets.UTF_8),
                    HMAC_ALGORITHM
            ));

            return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Nao foi possivel validar assinatura do webhook",
                    exception
            );
        }
    }
}
