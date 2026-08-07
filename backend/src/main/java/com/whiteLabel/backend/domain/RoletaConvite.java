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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RoletaConviteStatus status = RoletaConviteStatus.CONVERTIDO;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    protected RoletaConvite() {
    }

    public RoletaConvite(
            String codigo,
            Usuario usuarioIndicador,
            Usuario usuarioIndicado,
            RoletaConviteStatus status
    ) {
        this.codigo = Objects.requireNonNull(codigo);
        this.usuarioIndicador = Objects.requireNonNull(usuarioIndicador);
        this.usuarioIndicado = usuarioIndicado;
        setStatus(status);
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

    public RoletaConviteStatus getStatus() {
        return status;
    }

    public void setStatus(RoletaConviteStatus status) {
        this.status = status == null ? RoletaConviteStatus.CONVERTIDO : status;
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
