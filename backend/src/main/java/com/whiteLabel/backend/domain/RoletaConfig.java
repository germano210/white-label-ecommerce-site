package com.whiteLabel.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "roleta_config")
public class RoletaConfig {

    @Id
    private Long id;

    @Column(nullable = false)
    private Boolean ativa = true;

    @Column(nullable = false, length = 120)
    private String titulo = "Brecho da Cami";

    @Column(name = "meta_grupo", nullable = false)
    private Integer metaGrupo = 20;

    @Column(name = "progresso_grupo", nullable = false)
    private Integer progressoGrupo = 0;

    @Column(name = "giros_bonus_grupo", nullable = false)
    private Integer girosBonusGrupo = 5;

    @Column(name = "giros_iniciais", nullable = false)
    private Integer girosIniciais = 8;

    @Column(name = "giro_diario_quantidade", nullable = false)
    private Integer giroDiarioQuantidade = 1;

    @Column(name = "giro_diario_somente_quando_zerar", nullable = false)
    private Boolean giroDiarioSomenteQuandoZerar = true;

    @Column(name = "giros_ganhos_por_convite", nullable = false)
    private Integer girosGanhosPorConvite = 1;

    @Column(name = "atualizada_em", nullable = false)
    private LocalDateTime atualizadaEm;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Boolean getAtiva() {
        return ativa;
    }

    public void setAtiva(Boolean ativa) {
        this.ativa = ativa == null ? true : ativa;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo == null || titulo.isBlank() ? "Brecho da Cami" : titulo.trim();
    }

    public Integer getMetaGrupo() {
        return metaGrupo == null ? 20 : metaGrupo;
    }

    public void setMetaGrupo(Integer metaGrupo) {
        this.metaGrupo = Math.max(1, metaGrupo == null ? 20 : metaGrupo);
    }

    public Integer getProgressoGrupo() {
        return Math.max(0, progressoGrupo == null ? 0 : progressoGrupo);
    }

    public void setProgressoGrupo(Integer progressoGrupo) {
        this.progressoGrupo = Math.max(0, progressoGrupo == null ? 0 : progressoGrupo);
    }

    public Integer getGirosBonusGrupo() {
        return Math.max(0, girosBonusGrupo == null ? 5 : girosBonusGrupo);
    }

    public void setGirosBonusGrupo(Integer girosBonusGrupo) {
        this.girosBonusGrupo = Math.max(0, girosBonusGrupo == null ? 5 : girosBonusGrupo);
    }

    public Integer getGirosIniciais() {
        return Math.max(0, girosIniciais == null ? 0 : girosIniciais);
    }

    public void setGirosIniciais(Integer girosIniciais) {
        this.girosIniciais = Math.max(0, girosIniciais == null ? 0 : girosIniciais);
    }

    public Integer getGiroDiarioQuantidade() {
        return Math.max(0, giroDiarioQuantidade == null ? 0 : giroDiarioQuantidade);
    }

    public void setGiroDiarioQuantidade(Integer giroDiarioQuantidade) {
        this.giroDiarioQuantidade = Math.max(0, giroDiarioQuantidade == null ? 0 : giroDiarioQuantidade);
    }

    public Boolean getGiroDiarioSomenteQuandoZerar() {
        return giroDiarioSomenteQuandoZerar == null || giroDiarioSomenteQuandoZerar;
    }

    public void setGiroDiarioSomenteQuandoZerar(Boolean giroDiarioSomenteQuandoZerar) {
        this.giroDiarioSomenteQuandoZerar = giroDiarioSomenteQuandoZerar == null
                || giroDiarioSomenteQuandoZerar;
    }

    public Integer getGirosGanhosPorConvite() {
        return Math.max(0, girosGanhosPorConvite == null ? 0 : girosGanhosPorConvite);
    }

    public void setGirosGanhosPorConvite(Integer girosGanhosPorConvite) {
        this.girosGanhosPorConvite = Math.max(0, girosGanhosPorConvite == null ? 0 : girosGanhosPorConvite);
    }

    public LocalDateTime getAtualizadaEm() {
        return atualizadaEm;
    }

    @PrePersist
    @PreUpdate
    void atualizarData() {
        atualizadaEm = LocalDateTime.now();
    }
}
