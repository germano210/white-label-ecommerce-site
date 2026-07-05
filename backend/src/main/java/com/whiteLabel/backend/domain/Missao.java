package com.whiteLabel.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "missoes")
public class Missao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String titulo;

    @Column(nullable = false, length = 80)
    private String icone;

    @Column(name = "meta_progresso", nullable = false)
    private Integer metaProgresso;

    @Column(name = "tipo_acao", nullable = false, length = 80)
    private String tipoAcao;

    @Column(name = "valor_base", nullable = false)
    private Integer valorBase;

    @Column(nullable = false)
    private Integer peso = 1;

    @Column(nullable = false)
    private Boolean ativa = true;

    protected Missao() {
    }

    public Missao(
            String titulo,
            String icone,
            Integer metaProgresso,
            String tipoAcao,
            Integer valorBase,
            Integer peso
    ) {
        this.titulo = titulo;
        this.icone = icone;
        this.metaProgresso = metaProgresso;
        this.tipoAcao = tipoAcao;
        this.valorBase = valorBase;
        this.peso = peso == null ? 1 : peso;
    }

    public Long getId() {
        return id;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getIcone() {
        return icone;
    }

    public void setIcone(String icone) {
        this.icone = icone;
    }

    public Integer getMetaProgresso() {
        return metaProgresso;
    }

    public void setMetaProgresso(Integer metaProgresso) {
        this.metaProgresso = metaProgresso;
    }

    public String getTipoAcao() {
        return tipoAcao;
    }

    public void setTipoAcao(String tipoAcao) {
        this.tipoAcao = tipoAcao;
    }

    public Integer getValorBase() {
        return valorBase == null ? 0 : valorBase;
    }

    public void setValorBase(Integer valorBase) {
        this.valorBase = valorBase;
    }

    public Integer getPeso() {
        return peso == null ? 1 : peso;
    }

    public void setPeso(Integer peso) {
        this.peso = peso == null ? 1 : peso;
    }

    public Boolean getAtiva() {
        return ativa;
    }

    public void desativar() {
        this.ativa = false;
    }

    @PrePersist
    void preencherDefaultsGamificacao() {
        if (peso == null) {
            peso = 1;
        }
    }
}
