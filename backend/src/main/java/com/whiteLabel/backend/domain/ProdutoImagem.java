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

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "produto_imagens")
public class ProdutoImagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "produto_id", nullable = false)
    private Produto produto;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false)
    private Integer ordem = 0;

    @Column(nullable = false)
    private Boolean principal = false;

    @Column(
            name = "criada_em",
            nullable = false,
            updatable = false,
            columnDefinition = "timestamp default current_timestamp"
    )
    private LocalDateTime criadaEm;

    protected ProdutoImagem() {
    }

    public ProdutoImagem(Produto produto, String url, Integer ordem, Boolean principal) {
        this.produto = Objects.requireNonNull(produto);
        this.url = Objects.requireNonNull(url);
        this.ordem = ordem == null ? 0 : ordem;
        this.principal = principal != null && principal;
    }

    @PrePersist
    void preencherCriadaEm() {
        if (criadaEm == null) {
            criadaEm = LocalDateTime.now();
        }

        if (ordem == null) {
            ordem = 0;
        }

        if (principal == null) {
            principal = false;
        }
    }

    public Long getId() {
        return id;
    }

    public Produto getProduto() {
        return produto;
    }

    public String getUrl() {
        return url;
    }

    public Integer getOrdem() {
        return ordem == null ? 0 : ordem;
    }

    public void setOrdem(Integer ordem) {
        this.ordem = ordem == null ? 0 : ordem;
    }

    public Boolean getPrincipal() {
        return principal != null && principal;
    }

    public void setPrincipal(Boolean principal) {
        this.principal = principal != null && principal;
    }

    public LocalDateTime getCriadaEm() {
        return criadaEm;
    }
}
