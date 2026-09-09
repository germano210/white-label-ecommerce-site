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
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(
        name = "roleta_convites",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_roleta_convite_indicado", columnNames = "indicado_id")
        }
)
public class RoletaConvite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "indicador_id", nullable = false)
    private Usuario usuarioIndicador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "indicado_id")
    private Usuario usuarioIndicado;

    @Column(nullable = false, length = 40)
    private String codigo;

    @Column(name = "giros_concedidos", nullable = false, columnDefinition = "integer default 0")
    private Integer girosConcedidos = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RoletaConviteStatus status = RoletaConviteStatus.CONVERTIDO;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @Column(name = "convertido_em")
    private LocalDateTime convertidoEm;

    protected RoletaConvite() {
    }

    public RoletaConvite(
            String codigo,
            Usuario usuarioIndicador,
            Usuario usuarioIndicado,
            RoletaConviteStatus status,
            Integer girosConcedidos
    ) {
        this.codigo = Objects.requireNonNull(codigo);
        this.usuarioIndicador = Objects.requireNonNull(usuarioIndicador);
        this.usuarioIndicado = usuarioIndicado;
        setStatus(status);
        setGirosConcedidos(girosConcedidos);
    }

    public Long getId() {
        return id;
    }

    public Usuario getUsuarioIndicador() {
        return usuarioIndicador;
    }

    public Usuario getUsuarioIndicado() {
        return usuarioIndicado;
    }

    public String getCodigo() {
        return codigo;
    }

    public Integer getGirosConcedidos() {
        return Math.max(0, girosConcedidos == null ? 0 : girosConcedidos);
    }

    public void setGirosConcedidos(Integer girosConcedidos) {
        this.girosConcedidos = Math.max(0, girosConcedidos == null ? 0 : girosConcedidos);
    }

    public RoletaConviteStatus getStatus() {
        return status;
    }

    public void setStatus(RoletaConviteStatus status) {
        this.status = status == null ? RoletaConviteStatus.CONVERTIDO : status;
    }

    public void sincronizarComIndicacaoCentral(String codigo, Usuario usuarioIndicador) {
        this.codigo = Objects.requireNonNull(codigo);
        this.usuarioIndicador = Objects.requireNonNull(usuarioIndicador);
        this.status = RoletaConviteStatus.CONVERTIDO;
        if (convertidoEm == null) {
            convertidoEm = LocalDateTime.now();
        }
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public LocalDateTime getConvertidoEm() {
        return convertidoEm;
    }

    @PrePersist
    void preencherCriadoEm() {
        if (criadoEm == null) {
            criadoEm = LocalDateTime.now();
        }
        if (girosConcedidos == null) {
            girosConcedidos = 0;
        }
        if (status == RoletaConviteStatus.CONVERTIDO && convertidoEm == null) {
            convertidoEm = LocalDateTime.now();
        }
    }
}
