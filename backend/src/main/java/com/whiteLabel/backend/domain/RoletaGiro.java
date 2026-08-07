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
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "roleta_giros")
public class RoletaGiro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "valor_desconto", nullable = false, precision = 10, scale = 2)
    private BigDecimal valorDesconto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RoletaGiroStatus status = RoletaGiroStatus.PENDENTE;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @Column(name = "usado_em")
    private LocalDateTime usadoEm;

    protected RoletaGiro() {
    }

    public RoletaGiro(Usuario usuario, BigDecimal valorDesconto) {
        this.usuario = Objects.requireNonNull(usuario);
        this.valorDesconto = Objects.requireNonNull(valorDesconto);
    }

    public Long getId() {
        return id;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public BigDecimal getValorDesconto() {
        return valorDesconto;
    }

    public RoletaGiroStatus getStatus() {
        return status;
    }

    public void setStatus(RoletaGiroStatus status) {
        this.status = status == null ? RoletaGiroStatus.PENDENTE : status;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public LocalDateTime getUsadoEm() {
        return usadoEm;
    }

    @PrePersist
    void preencherCriadoEm() {
        if (criadoEm == null) {
            criadoEm = LocalDateTime.now();
        }
    }
}
