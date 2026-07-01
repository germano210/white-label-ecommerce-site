package com.whiteLabel.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.whiteLabel.backend.domain.Missao;

public record MissaoResponse(
        Long id,
        String titulo,
        String icone,
        @JsonProperty("meta_progresso")
        Integer metaProgresso,
        @JsonProperty("tipo_acao")
        String tipoAcao,
        Boolean ativa
) {

    public static MissaoResponse from(Missao missao) {
        return new MissaoResponse(
                missao.getId(),
                missao.getTitulo(),
                missao.getIcone(),
                missao.getMetaProgresso(),
                missao.getTipoAcao(),
                missao.getAtiva()
        );
    }
}
