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
        name = "curtidas",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_curtida_usuario_produto",
                columnNames = {"usuario_id", "produto_id"}
        )
)
public class Curtida {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    @Column(name = "data_curtida", nullable = false, updatable = false)
    private LocalDateTime dataCurtida;

    protected Curtida() {
    }

    public Curtida(Usuario usuario, Produto produto) {
        this.usuario = Objects.requireNonNull(usuario);
        this.produto = Objects.requireNonNull(produto);
    }

    @PrePersist
    void preencherDataCurtida() {
        if (dataCurtida == null) {
            dataCurtida = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public Produto getProduto() {
        return produto;
    }

    public LocalDateTime getDataCurtida() {
        return dataCurtida;
    }
}
