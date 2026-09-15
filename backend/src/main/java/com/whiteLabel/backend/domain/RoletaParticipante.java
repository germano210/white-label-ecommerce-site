package com.whiteLabel.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(
        name = "roleta_participantes",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_roleta_participante_usuario", columnNames = "usuario_id"),
                @UniqueConstraint(name = "uk_roleta_participante_codigo", columnNames = "codigo_convite")
        }
)
public class RoletaParticipante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "codigo_convite", nullable = false, length = 40)
    private String codigoConvite;

    @Column(name = "giros_totais_obtidos", nullable = false, columnDefinition = "integer default 0")
    private Integer girosTotaisObtidos = 0;

    @Column(name = "giros_disponiveis", nullable = false)
    private Integer girosDisponiveis = 0;

    @Column(
            name = "valor_disponivel_resgate",
            nullable = false,
            precision = 12,
            scale = 2,
            columnDefinition = "numeric(12,2) default 0.00"
    )
    private BigDecimal valorDisponivelResgate = BigDecimal.ZERO;

    @Column(
            name = "valor_total_resgatado",
            nullable = false,
            precision = 12,
            scale = 2,
            columnDefinition = "numeric(12,2) default 0.00"
    )
    private BigDecimal valorTotalResgatado = BigDecimal.ZERO;

    @Column(name = "ultimo_giro_diario_em")
    private LocalDateTime ultimoGiroDiarioEm;

    @Column(name = "convites_convertidos", nullable = false, columnDefinition = "integer default 0")
    private Integer convitesConvertidos = 0;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    protected RoletaParticipante() {
    }

    public RoletaParticipante(Usuario usuario, String codigoConvite, Integer girosDisponiveis) {
        this.usuario = Objects.requireNonNull(usuario);
        this.codigoConvite = Objects.requireNonNull(codigoConvite);
        adicionarGiros(girosDisponiveis);
    }

    public Long getId() {
        return id;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public String getCodigoConvite() {
        return codigoConvite;
    }

    public Integer getGirosTotaisObtidos() {
        return Math.max(0, girosTotaisObtidos == null ? 0 : girosTotaisObtidos);
    }

    public Integer getGirosDisponiveis() {
        return Math.max(0, girosDisponiveis == null ? 0 : girosDisponiveis);
    }

    public void setGirosDisponiveis(Integer girosDisponiveis) {
        this.girosDisponiveis = Math.max(0, girosDisponiveis == null ? 0 : girosDisponiveis);
    }

    public void adicionarGiros(Integer quantidade) {
        int incremento = Math.max(0, quantidade == null ? 0 : quantidade);
        adicionarGirosAoHistorico(incremento);
        adicionarGirosDisponiveis(incremento);
    }

    public void adicionarGirosAoHistorico(Integer quantidade) {
        int incremento = Math.max(0, quantidade == null ? 0 : quantidade);
        girosTotaisObtidos = getGirosTotaisObtidos() + incremento;
    }

    public void adicionarGirosDisponiveis(Integer quantidade) {
        int incremento = Math.max(0, quantidade == null ? 0 : quantidade);
        girosDisponiveis = getGirosDisponiveis() + incremento;
    }

    public void consumirGiro() {
        if (getGirosDisponiveis() > 0) {
            girosDisponiveis = getGirosDisponiveis() - 1;
        }
    }

    public BigDecimal getValorDisponivelResgate() {
        return normalizarValor(valorDisponivelResgate);
    }

    public BigDecimal getValorTotalResgatado() {
        return normalizarValor(valorTotalResgatado);
    }

    public void adicionarValorDisponivel(BigDecimal valor) {
        valorDisponivelResgate = getValorDisponivelResgate().add(normalizarValor(valor));
    }

    public BigDecimal sacarValorDisponivel() {
        BigDecimal valorSacado = getValorDisponivelResgate();
        valorDisponivelResgate = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        valorTotalResgatado = getValorTotalResgatado().add(valorSacado);
        return valorSacado;
    }

    public LocalDateTime getUltimoGiroDiarioEm() {
        return ultimoGiroDiarioEm;
    }

    public void setUltimoGiroDiarioEm(LocalDateTime ultimoGiroDiarioEm) {
        this.ultimoGiroDiarioEm = ultimoGiroDiarioEm;
    }

    public Integer getConvitesConvertidos() {
        return Math.max(0, convitesConvertidos == null ? 0 : convitesConvertidos);
    }

    public void incrementarConvitesConvertidos() {
        convitesConvertidos = getConvitesConvertidos() + 1;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public LocalDateTime getAtualizadoEm() {
        return atualizadoEm;
    }

    @PrePersist
    void preencherCriadoEm() {
        if (criadoEm == null) {
            criadoEm = LocalDateTime.now();
        }
        preencherPadroes();
        atualizadoEm = LocalDateTime.now();
    }

    @PreUpdate
    void preencherAtualizadoEm() {
        preencherPadroes();
        atualizadoEm = LocalDateTime.now();
    }

    private void preencherPadroes() {
        if (girosTotaisObtidos == null) {
            girosTotaisObtidos = 0;
        }
        if (girosDisponiveis == null) {
            girosDisponiveis = 0;
        }
        if (valorDisponivelResgate == null) {
            valorDisponivelResgate = BigDecimal.ZERO;
        }
        if (valorTotalResgatado == null) {
            valorTotalResgatado = BigDecimal.ZERO;
        }
        if (convitesConvertidos == null) {
            convitesConvertidos = 0;
        }
    }

    private BigDecimal normalizarValor(BigDecimal valor) {
        return (valor == null ? BigDecimal.ZERO : valor).setScale(2, RoundingMode.HALF_UP);
    }
}
