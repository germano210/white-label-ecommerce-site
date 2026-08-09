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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "opcao_id")
    private RoletaOpcao opcao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nivel_id")
    private RoletaNivel nivel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "premio_id")
    private RoletaPremio premio;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_premio", length = 40)
    private RoletaTipoPremio tipoPremio;

    @Column(name = "titulo_premio", length = 120)
    private String tituloPremio;

    @Column(name = "descricao_premio", length = 500)
    private String descricaoPremio;

    @Column(name = "valor_premio", precision = 12, scale = 2)
    private BigDecimal valorPremio = BigDecimal.ZERO;

    @Column(name = "giros_extras", nullable = false, columnDefinition = "integer default 0")
    private Integer girosExtras = 0;

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
        this.valorPremio = valorDesconto;
        this.tipoPremio = RoletaTipoPremio.DESCONTO_VALOR;
    }

    public RoletaGiro(
            Usuario usuario,
            RoletaOpcao opcao,
            BigDecimal valorPremio,
            Integer girosExtras
    ) {
        this.usuario = Objects.requireNonNull(usuario);
        this.opcao = Objects.requireNonNull(opcao);
        this.tipoPremio = opcao.getTipoPremio();
        this.tituloPremio = opcao.getTitulo();
        this.descricaoPremio = opcao.getDescricao();
        this.valorPremio = valorPremio == null ? BigDecimal.ZERO : valorPremio;
        this.girosExtras = Math.max(0, girosExtras == null ? 0 : girosExtras);
        this.valorDesconto = this.tipoPremio == RoletaTipoPremio.DESCONTO_VALOR
                ? this.valorPremio
                : BigDecimal.ZERO;
    }

    public RoletaGiro(
            Usuario usuario,
            RoletaNivel nivel,
            RoletaPremio premio,
            BigDecimal valorPremio,
            Integer girosExtras
    ) {
        this.usuario = Objects.requireNonNull(usuario);
        this.nivel = Objects.requireNonNull(nivel);
        this.premio = Objects.requireNonNull(premio);
        this.tipoPremio = premio.getTipoPremio();
        this.tituloPremio = premio.getTitulo();
        this.descricaoPremio = premio.getDescricao();
        this.valorPremio = valorPremio == null ? BigDecimal.ZERO : valorPremio;
        this.girosExtras = Math.max(0, girosExtras == null ? 0 : girosExtras);
        this.valorDesconto = this.tipoPremio == RoletaTipoPremio.DESCONTO_VALOR
                ? this.valorPremio
                : BigDecimal.ZERO;
    }

    public Long getId() {
        return id;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public RoletaOpcao getOpcao() {
        return opcao;
    }

    public RoletaNivel getNivel() {
        return nivel;
    }

    public RoletaPremio getPremio() {
        return premio;
    }

    public RoletaTipoPremio getTipoPremio() {
        return tipoPremio == null ? RoletaTipoPremio.DESCONTO_VALOR : tipoPremio;
    }

    public String getTituloPremio() {
        return tituloPremio;
    }

    public String getDescricaoPremio() {
        return descricaoPremio;
    }

    public BigDecimal getValorPremio() {
        return valorPremio == null ? BigDecimal.ZERO : valorPremio;
    }

    public Integer getGirosExtras() {
        return Math.max(0, girosExtras == null ? 0 : girosExtras);
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

    public void descartar() {
        status = RoletaGiroStatus.DESCARTADO;
    }

    public void marcarUsado() {
        status = RoletaGiroStatus.USADO;
        usadoEm = LocalDateTime.now();
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
        if (tipoPremio == null) {
            tipoPremio = RoletaTipoPremio.DESCONTO_VALOR;
        }
        if (valorPremio == null) {
            valorPremio = BigDecimal.ZERO;
        }
        if (girosExtras == null) {
            girosExtras = 0;
        }
        if (valorDesconto == null) {
            valorDesconto = BigDecimal.ZERO;
        }
    }
}
