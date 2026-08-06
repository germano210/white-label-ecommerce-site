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

import java.time.LocalDateTime;

@Entity
@Table(name = "indicacoes")
public class Indicacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 40)
    private String codigo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_indicador_id", nullable = false)
    private Usuario usuarioIndicador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_indicado_id")
    private Usuario usuarioIndicado;

    @Column(name = "aberto_em")
    private LocalDateTime abertoEm;

    @Column(name = "convertido_em")
    private LocalDateTime convertidoEm;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private IndicacaoStatus status;

    protected Indicacao() {
    }

    public static Indicacao aberta(String codigo, Usuario usuarioIndicador, LocalDateTime abertoEm) {
        Indicacao indicacao = new Indicacao();
        indicacao.codigo = codigo;
        indicacao.usuarioIndicador = usuarioIndicador;
        indicacao.abertoEm = abertoEm;
        indicacao.status = IndicacaoStatus.ABERTA;
        return indicacao;
    }

    public static Indicacao convertida(
            String codigo,
            Usuario usuarioIndicador,
            Usuario usuarioIndicado,
            LocalDateTime convertidoEm
    ) {
        Indicacao indicacao = new Indicacao();
        indicacao.codigo = codigo;
        indicacao.usuarioIndicador = usuarioIndicador;
        indicacao.usuarioIndicado = usuarioIndicado;
        indicacao.convertidoEm = convertidoEm;
        indicacao.status = IndicacaoStatus.CONVERTIDA;
        return indicacao;
    }

    @PrePersist
    void preencherStatusPadrao() {
        if (status == null) {
            status = usuarioIndicado == null ? IndicacaoStatus.ABERTA : IndicacaoStatus.CONVERTIDA;
        }
    }

    public Long getId() {
        return id;
    }

    public String getCodigo() {
        return codigo;
    }

    public Usuario getUsuarioIndicador() {
        return usuarioIndicador;
    }

    public Usuario getUsuarioIndicado() {
        return usuarioIndicado;
    }

    public LocalDateTime getAbertoEm() {
        return abertoEm;
    }

    public LocalDateTime getConvertidoEm() {
        return convertidoEm;
    }

    public IndicacaoStatus getStatus() {
        return status;
    }
}
