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
        name = "compartilhamentos_aberturas",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_compartilhamento_visitante",
                columnNames = {"compartilhamento_id", "usuario_visitante_id"}
        )
)
public class CompartilhamentoAbertura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "compartilhamento_id", nullable = false)
    private CompartilhamentoItem compartilhamento;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_visitante_id", nullable = false)
    private Usuario usuarioVisitante;

    @Column(name = "data_abertura", nullable = false, updatable = false)
    private LocalDateTime dataAbertura;

    protected CompartilhamentoAbertura() {
    }

    public CompartilhamentoAbertura(
            CompartilhamentoItem compartilhamento,
            Usuario usuarioVisitante
    ) {
        this.compartilhamento = Objects.requireNonNull(compartilhamento);
        this.usuarioVisitante = Objects.requireNonNull(usuarioVisitante);
    }

    public Long getId() {
        return id;
    }

    public CompartilhamentoItem getCompartilhamento() {
        return compartilhamento;
    }

    public Usuario getUsuarioVisitante() {
        return usuarioVisitante;
    }

    public LocalDateTime getDataAbertura() {
        return dataAbertura;
    }

    @PrePersist
    void preencherDataAbertura() {
        if (dataAbertura == null) {
            dataAbertura = LocalDateTime.now();
        }
    }
}
