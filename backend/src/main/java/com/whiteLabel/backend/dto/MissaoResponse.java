package com.whiteLabel.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.whiteLabel.backend.domain.Missao;
import com.whiteLabel.backend.domain.UsuarioMissao;

public record MissaoResponse(
        Long id,
        String titulo,
        String icone,
        @JsonProperty("meta_progresso")
        Integer metaProgresso,
        @JsonProperty("tipo_acao")
        String tipoAcao,
        Integer valorBase,
        Integer peso,
        Boolean ativa,
        Integer progresso,
        Boolean concluida,
        Boolean recompensaResgatada,
        Integer xpConcedido
) {

    public static MissaoResponse from(Missao missao) {
        return from(missao, null);
    }

    public static MissaoResponse from(Missao missao, UsuarioMissao progresso) {
        return new MissaoResponse(
                missao.getId(),
                missao.getTitulo(),
                missao.getIcone(),
                missao.getMetaProgresso(),
                missao.getTipoAcao(),
                missao.getValorBase(),
                missao.getPeso(),
                missao.getAtiva(),
                progresso == null ? 0 : progresso.getProgressoAtual(),
                progresso != null && progresso.getConcluida(),
                progresso != null && progresso.getRecompensaResgatada(),
                progresso == null ? 0 : progresso.getXpConcedido()
        );
    }
}
