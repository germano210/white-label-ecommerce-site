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

import java.time.LocalDateTime;

@Entity
@Table(name = "roleta_metas")
public class RoletaMeta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String titulo;

    @Column(length = 500)
    private String descricao;

    @Column(name = "quantidade_alvo", nullable = false)
    private Integer quantidadeAlvo = 20;

    @Column(name = "giros_recompensa", nullable = false)
    private Integer girosRecompensa = 5;

    @Column(name = "progresso_atual", nullable = false, columnDefinition = "integer default 0")
    private Integer progressoAtual = 0;

    @Column(nullable = false, columnDefinition = "integer default 0")
    private Integer ordem = 0;

    @Column(nullable = false, columnDefinition = "boolean default true")
    private Boolean ativa = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RoletaMetaStatus status = RoletaMetaStatus.NAO_INICIADA;

    @Column(name = "criada_em", nullable = false, updatable = false)
    private LocalDateTime criadaEm;

    @Column(name = "atualizada_em", nullable = false)
    private LocalDateTime atualizadaEm;

    @Column(name = "iniciada_em")
    private LocalDateTime iniciadaEm;

    @Column(name = "concluida_em")
    private LocalDateTime concluidaEm;

    public Long getId() {
        return id;
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

    public Integer getQuantidadeAlvo() {
        return Math.max(1, quantidadeAlvo == null ? 20 : quantidadeAlvo);
    }

    public void setQuantidadeAlvo(Integer quantidadeAlvo) {
        this.quantidadeAlvo = Math.max(1, quantidadeAlvo == null ? 20 : quantidadeAlvo);
    }

    public Integer getGirosRecompensa() {
        return Math.max(1, girosRecompensa == null ? 5 : girosRecompensa);
    }

    public void setGirosRecompensa(Integer girosRecompensa) {
        this.girosRecompensa = Math.max(1, girosRecompensa == null ? 5 : girosRecompensa);
    }

    public Integer getProgressoAtual() {
        return Math.max(0, progressoAtual == null ? 0 : progressoAtual);
    }

    public void setProgressoAtual(Integer progressoAtual) {
        this.progressoAtual = Math.max(0, progressoAtual == null ? 0 : progressoAtual);
    }

    public Integer getOrdem() {
        return ordem == null ? 0 : ordem;
    }

    public void setOrdem(Integer ordem) {
        this.ordem = Math.max(0, ordem == null ? 0 : ordem);
    }

    public Boolean getAtiva() {
        return ativa == null || ativa;
    }

    public void setAtiva(Boolean ativa) {
        this.ativa = ativa == null || ativa;
    }

    public RoletaMetaStatus getStatus() {
        return status == null ? RoletaMetaStatus.NAO_INICIADA : status;
    }

    public void setStatus(RoletaMetaStatus status) {
        this.status = status == null ? RoletaMetaStatus.NAO_INICIADA : status;
    }

    public LocalDateTime getCriadaEm() {
        return criadaEm;
    }

    public LocalDateTime getAtualizadaEm() {
        return atualizadaEm;
    }

    public LocalDateTime getIniciadaEm() {
        return iniciadaEm;
    }

    public LocalDateTime getConcluidaEm() {
        return concluidaEm;
    }

    public void iniciar(LocalDateTime agora) {
        if (getStatus() == RoletaMetaStatus.CONCLUIDA) {
            return;
        }
        status = RoletaMetaStatus.EM_ANDAMENTO;
        if (iniciadaEm == null) {
            iniciadaEm = agora;
        }
    }

    public void concluir(LocalDateTime agora) {
        progressoAtual = getQuantidadeAlvo();
        status = RoletaMetaStatus.CONCLUIDA;
        concluidaEm = agora;
    }

    public void reiniciar() {
        progressoAtual = 0;
        status = RoletaMetaStatus.NAO_INICIADA;
        iniciadaEm = null;
        concluidaEm = null;
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
        if (quantidadeAlvo == null) {
            quantidadeAlvo = 20;
        }
        if (girosRecompensa == null) {
            girosRecompensa = 5;
        }
        if (progressoAtual == null) {
            progressoAtual = 0;
        }
        if (ordem == null) {
            ordem = 0;
        }
        if (ativa == null) {
            ativa = true;
        }
        if (status == null) {
            status = RoletaMetaStatus.NAO_INICIADA;
        }
    }
}
