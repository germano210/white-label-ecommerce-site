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
        name = "roleta_produtos",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_roleta_produto_produto", columnNames = "produto_id")
        }
)
public class RoletaProduto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    @Column(nullable = false)
    private Boolean ativo = true;

    @Column(nullable = false)
    private Integer ordem = 0;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    protected RoletaProduto() {
    }

    public RoletaProduto(Produto produto, Integer ordem) {
        this.produto = Objects.requireNonNull(produto);
        this.ordem = ordem == null ? 0 : ordem;
    }

    public Long getId() {
        return id;
    }

    public Produto getProduto() {
        return produto;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo == null || ativo;
    }

    public Integer getOrdem() {
        return ordem == null ? 0 : ordem;
    }

    public void setOrdem(Integer ordem) {
        this.ordem = ordem == null ? 0 : ordem;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    @PrePersist
    void preencherCriadoEm() {
        if (criadoEm == null) {
            criadoEm = LocalDateTime.now();
        }
    }
}
