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

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Entity
@Table(name = "roleta_premios")
public class RoletaPremio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "nivel_id", nullable = false)
    private RoletaNivel nivel;

    @Column(nullable = false, length = 120)
    private String titulo;

    @Column(length = 500)
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_premio", nullable = false, length = 40)
    private RoletaTipoPremio tipoPremio = RoletaTipoPremio.DESCONTO_VALOR;

    @Column(nullable = false, precision = 12, scale = 2, columnDefinition = "numeric(12,2) default 0.00")
    private BigDecimal valor = BigDecimal.ZERO;

    @Column(
            name = "peso_interno",
            nullable = false,
            precision = 18,
            scale = 8,
            columnDefinition = "numeric(18,8) default 1.00000000"
    )
    private BigDecimal pesoInterno = BigDecimal.ONE;

    @Column(nullable = false, columnDefinition = "integer default 0")
    private Integer ordem = 0;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private Boolean ativo = true;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    public Long getId() {
        return id;
    }

    public RoletaNivel getNivel() {
        return nivel;
    }

    public void setNivel(RoletaNivel nivel) {
        this.nivel = nivel;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo == null ? null : titulo.trim();
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao == null || descricao.isBlank() ? null : descricao.trim();
    }

    public RoletaTipoPremio getTipoPremio() {
        return tipoPremio == null ? RoletaTipoPremio.DESCONTO_VALOR : tipoPremio;
    }

    public void setTipoPremio(RoletaTipoPremio tipoPremio) {
        this.tipoPremio = tipoPremio == null ? RoletaTipoPremio.DESCONTO_VALOR : tipoPremio;
    }

    public BigDecimal getValor() {
        return normalizarValor(valor);
    }

    public void setValor(BigDecimal valor) {
        this.valor = normalizarValor(valor);
    }

    public BigDecimal getPesoInterno() {
        return normalizarPeso(pesoInterno);
    }

    public void setPesoInterno(BigDecimal pesoInterno) {
        this.pesoInterno = normalizarPeso(pesoInterno);
    }

    public Integer getOrdem() {
        return ordem == null ? 0 : ordem;
    }

    public void setOrdem(Integer ordem) {
        this.ordem = ordem == null ? 0 : ordem;
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
        if (tipoPremio == null) {
            tipoPremio = RoletaTipoPremio.DESCONTO_VALOR;
        }
        if (valor == null) {
            valor = BigDecimal.ZERO;
        }
        if (pesoInterno == null) {
            pesoInterno = BigDecimal.ONE;
        }
        if (ordem == null) {
            ordem = 0;
        }
        if (ativo == null) {
            ativo = true;
        }
    }

    private BigDecimal normalizarValor(BigDecimal valor) {
        return (valor == null ? BigDecimal.ZERO : valor).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal normalizarPeso(BigDecimal valor) {
        return (valor == null ? BigDecimal.ONE : valor).setScale(8, RoundingMode.HALF_UP);
    }
}
