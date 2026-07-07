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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(
        name = "usuario_missoes",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_usuario_missao",
                columnNames = {"usuario_id", "missao_id"}
        )
)
public class UsuarioMissao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "missao_id", nullable = false)
    private Missao missao;

    @Column(name = "progresso_atual", nullable = false)
    private Integer progressoAtual = 0;

    @Column(nullable = false)
    private Boolean concluida = false;

    @Column(name = "recompensa_resgatada", nullable = false)
    private Boolean recompensaResgatada = false;

    @Column(name = "xp_concedido", nullable = false)
    private Integer xpConcedido = 0;

    @Column(name = "data_inicio", nullable = false, updatable = false)
    private LocalDateTime dataInicio;

    @Column(name = "data_conclusao")
    private LocalDateTime dataConclusao;

    @Column(name = "data_atualizacao", nullable = false)
    private LocalDateTime dataAtualizacao;

    protected UsuarioMissao() {
    }

    public UsuarioMissao(Usuario usuario, Missao missao) {
        this.usuario = Objects.requireNonNull(usuario);
        this.missao = Objects.requireNonNull(missao);
    }

    public Long getId() {
        return id;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public Missao getMissao() {
        return missao;
    }

    public Integer getProgressoAtual() {
        return progressoAtual == null ? 0 : progressoAtual;
    }

    public Boolean getConcluida() {
        return concluida != null && concluida;
    }

    public Boolean getRecompensaResgatada() {
        return recompensaResgatada != null && recompensaResgatada;
    }

    public Integer getXpConcedido() {
        return xpConcedido == null ? 0 : xpConcedido;
    }

    public LocalDateTime getDataInicio() {
        return dataInicio;
    }

    public LocalDateTime getDataConclusao() {
        return dataConclusao;
    }

    public LocalDateTime getDataAtualizacao() {
        return dataAtualizacao;
    }

    public void incrementarAteMeta(Integer metaProgresso) {
        int meta = Math.max(1, metaProgresso == null ? 1 : metaProgresso);
        progressoAtual = Math.min(meta, getProgressoAtual() + 1);
    }

    public boolean atingiuMeta(Integer metaProgresso) {
        int meta = Math.max(1, metaProgresso == null ? 1 : metaProgresso);

        return getProgressoAtual() >= meta;
    }

    public void concluir(Integer xpConcedido) {
        concluida = true;
        recompensaResgatada = true;
        this.xpConcedido = xpConcedido == null ? 0 : xpConcedido;

        if (dataConclusao == null) {
            dataConclusao = LocalDateTime.now();
        }
    }

    @PrePersist
    void preencherDatasCriacao() {
        LocalDateTime agora = LocalDateTime.now();

        if (progressoAtual == null) {
            progressoAtual = 0;
        }

        if (concluida == null) {
            concluida = false;
        }

        if (recompensaResgatada == null) {
            recompensaResgatada = false;
        }

        if (xpConcedido == null) {
            xpConcedido = 0;
        }

        if (dataInicio == null) {
            dataInicio = agora;
        }

        if (dataAtualizacao == null) {
            dataAtualizacao = agora;
        }
    }

    @PreUpdate
    void preencherDataAtualizacao() {
        dataAtualizacao = LocalDateTime.now();
    }
}
