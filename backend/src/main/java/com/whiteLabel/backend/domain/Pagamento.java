package com.whiteLabel.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Version;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(
        name = "pagamentos",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_pagamento_checkout", columnNames = "checkout_id"),
                @UniqueConstraint(name = "uk_pagamento_event_id", columnNames = "event_id"),
                @UniqueConstraint(name = "uk_pagamento_payment_id", columnNames = "payment_id")
        }
)
public class Pagamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pedido_id", nullable = false)
    private Pedido pedido;

    @Column(nullable = false, length = 80)
    private String provider = "EXTERNAL_CHECKOUT";

    @Column(name = "checkout_id", nullable = false, length = 120)
    private String checkoutId;

    @Column(name = "payment_id", length = 120)
    private String paymentId;

    @Column(name = "event_id", length = 120)
    private String eventId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private PagamentoStatus status = PagamentoStatus.AGUARDANDO_PAGAMENTO;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valor;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private LocalDateTime dataCriacao;

    @Column(name = "data_atualizacao", nullable = false)
    private LocalDateTime dataAtualizacao;

    @Version
    private Long versao;

    protected Pagamento() {
    }

    public Pagamento(Pedido pedido, String checkoutId) {
        this.pedido = Objects.requireNonNull(pedido);
        this.checkoutId = Objects.requireNonNull(checkoutId);
        this.valor = pedido.getValorTotal();
    }

    public void registrarWebhook(
            String eventId,
            String paymentId,
            PagamentoStatus status
    ) {
        this.eventId = Objects.requireNonNull(eventId);
        this.paymentId = paymentId;
        this.status = Objects.requireNonNull(status);
    }

    @PrePersist
    void preencherDatasCriacao() {
        LocalDateTime agora = LocalDateTime.now();
        dataCriacao = agora;
        dataAtualizacao = agora;

        if (status == null) {
            status = PagamentoStatus.AGUARDANDO_PAGAMENTO;
        }

        if (valor == null) {
            valor = pedido.getValorTotal();
        }
    }

    @PreUpdate
    void preencherDataAtualizacao() {
        dataAtualizacao = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Pedido getPedido() {
        return pedido;
    }

    public String getProvider() {
        return provider;
    }

    public String getCheckoutId() {
        return checkoutId;
    }

    public String getPaymentId() {
        return paymentId;
    }

    public String getEventId() {
        return eventId;
    }

    public PagamentoStatus getStatus() {
        return status;
    }

    public BigDecimal getValor() {
        return valor;
    }
}
