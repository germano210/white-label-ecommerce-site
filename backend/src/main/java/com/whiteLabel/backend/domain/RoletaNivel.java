package com.whiteLabel.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Entity
@Table(name = "roleta_niveis")
public class RoletaNivel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(length = 500)
    private String descricao;

    @Column(name = "cor_hex", nullable = false, length = 7)
    private String corHex = "#4b69ff";

    @Column(nullable = false)
    private Integer ordem = 0;

    @Column(
            name = "peso_relativo",
            nullable = false,
            precision = 18,
            scale = 8,
            columnDefinition = "numeric(18,8) default 1.00000000"
    )
    private BigDecimal pesoRelativo = BigDecimal.ONE;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private Boolean ativo = true;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome == null ? null : nome.trim();
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao == null || descricao.isBlank() ? null : descricao.trim();
    }

    public String getCorHex() {
        return corHex;
    }

    public void setCorHex(String corHex) {
        this.corHex = corHex == null || corHex.isBlank() ? "#4b69ff" : corHex.trim();
    }

    public Integer getOrdem() {
        return ordem == null ? 0 : ordem;
    }

    public void setOrdem(Integer ordem) {
        this.ordem = ordem == null ? 0 : ordem;
    }

    public BigDecimal getPesoRelativo() {
        return normalizarPeso(pesoRelativo);
    }

    public void setPesoRelativo(BigDecimal pesoRelativo) {
        this.pesoRelativo = normalizarPeso(pesoRelativo);
    }

    public Boolean getAtivo() {
        return ativo == null || ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo == null || ativo;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public LocalDateTime getAtualizadoEm() {
        return atualizadoEm;
    }

    @PrePersist
    void preencherCriacao() {
        if (criadoEm == null) {
            criadoEm = LocalDateTime.now();
        }
        preencherPadroes();
        atualizadoEm = LocalDateTime.now();
    }

    @PreUpdate
    void preencherAtualizacao() {
        preencherPadroes();
        atualizadoEm = LocalDateTime.now();
    }

    private void preencherPadroes() {
        if (corHex == null || corHex.isBlank()) {
            corHex = "#4b69ff";
        }
        if (ordem == null) {
            ordem = 0;
        }
        if (pesoRelativo == null) {
            pesoRelativo = BigDecimal.ONE;
        }
        if (ativo == null) {
            ativo = true;
        }
    }

    private BigDecimal normalizarPeso(BigDecimal valor) {
        BigDecimal peso = valor == null ? BigDecimal.ONE : valor;
        if (peso.compareTo(BigDecimal.ZERO) < 0) {
            return BigDecimal.ZERO.setScale(8, RoundingMode.HALF_UP);
        }
        return peso.setScale(8, RoundingMode.HALF_UP);
    }
}
