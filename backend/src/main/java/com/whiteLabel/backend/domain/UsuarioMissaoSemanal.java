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
        name = "usuario_missoes_semanais",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_usuario_missao_semana",
                columnNames = {"usuario_id", "missao_id", "semana_inicio"}
        )
)
public class UsuarioMissaoSemanal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "missao_id", nullable = false)
    private Missao missao;

    @Column(name = "semana_inicio", nullable = false)
    private LocalDateTime semanaInicio;

    @Column(name = "semana_fim", nullable = false)
    private LocalDateTime semanaFim;

    @Column(name = "progresso_atual", nullable = false)
    private Integer progressoAtual = 0;

    @Column(nullable = false)
    private Boolean concluida = false;

    @Column(name = "recompensa_resgatada", nullable = false)
    private Boolean recompensaResgatada = false;

    @Column(name = "xp_concedido", nullable = false)
    private Integer xpConcedido = 0;

    @Column(name = "tentativas_concedidas", nullable = false)
    private Integer tentativasConcedidas = 0;

    @Column(name = "data_inicio", nullable = false, updatable = false)
    private LocalDateTime dataInicio;

    @Column(name = "data_conclusao")
    private LocalDateTime dataConclusao;

    @Column(name = "data_atualizacao", nullable = false)
    private LocalDateTime dataAtualizacao;

    protected UsuarioMissaoSemanal() {
    }

    public UsuarioMissaoSemanal(
            Usuario usuario,
            Missao missao,
            LocalDateTime semanaInicio,
            LocalDateTime semanaFim
    ) {
        this.usuario = Objects.requireNonNull(usuario);
        this.missao = Objects.requireNonNull(missao);
        this.semanaInicio = Objects.requireNonNull(semanaInicio);
        this.semanaFim = Objects.requireNonNull(semanaFim);
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

    public LocalDateTime getSemanaInicio() {
        return semanaInicio;
    }

    public LocalDateTime getSemanaFim() {
        return semanaFim;
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

    public Integer getTentativasConcedidas() {
        return tentativasConcedidas == null ? 0 : tentativasConcedidas;
    }

    public void incrementarAteMeta(Integer metaProgresso) {
        int meta = Math.max(1, metaProgresso == null ? 1 : metaProgresso);
        progressoAtual = Math.min(meta, getProgressoAtual() + 1);
    }

    public void definirProgresso(Integer progresso, Integer metaProgresso) {
        int meta = Math.max(1, metaProgresso == null ? 1 : metaProgresso);
        int progressoSeguro = Math.max(0, progresso == null ? 0 : progresso);
        progressoAtual = Math.min(meta, Math.max(getProgressoAtual(), progressoSeguro));
    }

    public boolean atingiuMeta(Integer metaProgresso) {
        int meta = Math.max(1, metaProgresso == null ? 1 : metaProgresso);

        return getProgressoAtual() >= meta;
    }

    public void concluir(Integer xpConcedido, Integer tentativasConcedidas) {
        concluida = true;
        this.xpConcedido = xpConcedido == null ? 0 : xpConcedido;
        this.tentativasConcedidas = tentativasConcedidas == null ? 0 : tentativasConcedidas;

        if (dataConclusao == null) {
            dataConclusao = LocalDateTime.now();
        }
    }

    public void marcarRecompensaResgatada() {
        recompensaResgatada = true;
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

        if (tentativasConcedidas == null) {
            tentativasConcedidas = 0;
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
