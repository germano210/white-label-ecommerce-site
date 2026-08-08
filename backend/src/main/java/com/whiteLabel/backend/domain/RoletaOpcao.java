package com.whiteLabel.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "roleta_opcoes")
public class RoletaOpcao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer nivel;

    @Column(nullable = false, length = 120)
    private String titulo;

    @Column(length = 500)
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_premio", nullable = false, length = 40)
    private RoletaTipoPremio tipoPremio = RoletaTipoPremio.DESCONTO_VALOR;

    @Column(name = "valor_minimo", precision = 12, scale = 2)
    private BigDecimal valorMinimo = BigDecimal.ZERO;

    @Column(name = "valor_maximo", precision = 12, scale = 2)
    private BigDecimal valorMaximo = BigDecimal.ZERO;

    @Column(nullable = false, columnDefinition = "integer default 1")
    private Integer peso = 1;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private Boolean ativa = true;

    @Column(nullable = false, columnDefinition = "integer default 0")
    private Integer ordem = 0;

    @Column(name = "criada_em", nullable = false, updatable = false)
    private LocalDateTime criadaEm;

    @Column(name = "atualizada_em", nullable = false)
    private LocalDateTime atualizadaEm;

    public Long getId() {
        return id;
    }

    public Integer getNivel() {
        return nivel;
    }

    public void setNivel(Integer nivel) {
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

    public BigDecimal getValorMinimo() {
        return normalizarValor(valorMinimo);
    }

    public void setValorMinimo(BigDecimal valorMinimo) {
        this.valorMinimo = normalizarValor(valorMinimo);
    }

    public BigDecimal getValorMaximo() {
        return normalizarValor(valorMaximo);
    }

    public void setValorMaximo(BigDecimal valorMaximo) {
        this.valorMaximo = normalizarValor(valorMaximo);
    }

    public Integer getPeso() {
        return Math.max(0, peso == null ? 0 : peso);
    }

    public void setPeso(Integer peso) {
        this.peso = Math.max(0, peso == null ? 0 : peso);
    }

    public Boolean getAtiva() {
        return ativa == null || ativa;
    }

    public void setAtiva(Boolean ativa) {
        this.ativa = ativa == null || ativa;
    }

    public Integer getOrdem() {
        return ordem == null ? 0 : ordem;
    }

    public void setOrdem(Integer ordem) {
        this.ordem = ordem == null ? 0 : ordem;
    }

    public LocalDateTime getCriadaEm() {
        return criadaEm;
    }

    public LocalDateTime getAtualizadaEm() {
        return atualizadaEm;
    }

    @PrePersist
    void preencherCriacao() {
        if (criadaEm == null) {
            criadaEm = LocalDateTime.now();
        }
        preencherPadroes();
        atualizadaEm = LocalDateTime.now();
    }

    @PreUpdate
    void preencherAtualizacao() {
        preencherPadroes();
        atualizadaEm = LocalDateTime.now();
    }

    private void preencherPadroes() {
        if (tipoPremio == null) {
            tipoPremio = RoletaTipoPremio.DESCONTO_VALOR;
        }
        if (valorMinimo == null) {
            valorMinimo = BigDecimal.ZERO;
        }
        if (valorMaximo == null) {
            valorMaximo = BigDecimal.ZERO;
        }
        if (peso == null) {
            peso = 1;
        }
        if (ativa == null) {
            ativa = true;
        }
        if (ordem == null) {
            ordem = 0;
        }
    }

    private BigDecimal normalizarValor(BigDecimal valor) {
        return (valor == null ? BigDecimal.ZERO : valor).setScale(2, RoundingMode.HALF_UP);
    }
}
