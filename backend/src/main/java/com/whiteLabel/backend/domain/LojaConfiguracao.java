package com.whiteLabel.backend.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "loja_configuracao")
public class LojaConfiguracao {

    @Id
    private Long id;

    @Column(name = "condicao_casas_decimais", nullable = false)
    private Integer condicaoCasasDecimais = 1;

    @Column(name = "atualizada_em", nullable = false)
    private LocalDateTime atualizadaEm;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getCondicaoCasasDecimais() {
        return condicaoCasasDecimais == null ? 1 : condicaoCasasDecimais;
    }

    public void setCondicaoCasasDecimais(Integer condicaoCasasDecimais) {
        this.condicaoCasasDecimais = condicaoCasasDecimais == null ? 1 : condicaoCasasDecimais;
    }

    public LocalDateTime getAtualizadaEm() {
        return atualizadaEm;
    }

    @PrePersist
    @PreUpdate
    void preencherAtualizadaEm() {
        if (condicaoCasasDecimais == null) {
            condicaoCasasDecimais = 1;
        }

        atualizadaEm = LocalDateTime.now();
    }
}
