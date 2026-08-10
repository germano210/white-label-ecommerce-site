package com.whiteLabel.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(
        name = "roleta_giro_creditos",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_roleta_giro_credito_evento", columnNames = "chave_evento")
        }
)
public class RoletaGiroCredito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "participante_id", nullable = false)
    private RoletaParticipante participante;

    @Column(name = "chave_evento", nullable = false, length = 180)
    private String chaveEvento;

    @Column(name = "tipo", nullable = false, length = 40)
    private String tipo;

    @Column(name = "quantidade", nullable = false)
    private Integer quantidade;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    protected RoletaGiroCredito() {
    }

    public RoletaGiroCredito(
            RoletaParticipante participante,
            String chaveEvento,
            Integer quantidade
    ) {
        this.participante = Objects.requireNonNull(participante);
        this.chaveEvento = Objects.requireNonNull(chaveEvento);
        this.tipo = extrairTipo(chaveEvento);
        this.quantidade = Math.max(0, quantidade == null ? 0 : quantidade);
    }

    public Long getId() {
        return id;
    }

    public RoletaParticipante getParticipante() {
        return participante;
    }

    public String getChaveEvento() {
        return chaveEvento;
    }

    public String getTipo() {
        return tipo;
    }

    public Integer getQuantidade() {
        return Math.max(0, quantidade == null ? 0 : quantidade);
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    @PrePersist
    void preencherPadroes() {
        if (criadoEm == null) {
            criadoEm = LocalDateTime.now();
        }
        if (tipo == null || tipo.isBlank()) {
            tipo = extrairTipo(chaveEvento);
        }
        if (quantidade == null) {
            quantidade = 0;
        }
    }

    private String extrairTipo(String chaveEvento) {
        if (chaveEvento == null || chaveEvento.isBlank()) {
            return "DESCONHECIDO";
        }
        int separador = chaveEvento.indexOf(':');
        return separador > 0 ? chaveEvento.substring(0, separador) : chaveEvento;
    }
}
