package com.whiteLabel.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.whiteLabel.backend.domain.Missao;
import com.whiteLabel.backend.domain.MissaoTipoAcao;
import com.whiteLabel.backend.domain.UsuarioMissaoSemanal;

public record MissaoSemanalResponse(
        Long id,
        String titulo,
        String descricao,
        String icone,
        @JsonProperty("meta_progresso")
        Integer metaProgresso,
        @JsonProperty("tipo_acao")
        String tipoAcao,
        Integer progresso,
        Boolean concluida,
        Boolean bloqueada,
        Boolean recompensaResgatada,
        Integer tentativasRecompensa,
        Integer xpRecompensa,
        Boolean ativa
) {

    public static MissaoSemanalResponse from(Missao missao, UsuarioMissaoSemanal progresso) {
        boolean bloqueada = MissaoTipoAcao.BONUS_DIARIO.name().equals(missao.getTipoAcao());

        return new MissaoSemanalResponse(
                missao.getId(),
                missao.getTitulo(),
                missao.getDescricao(),
                missao.getIcone(),
                missao.getMetaProgresso(),
                missao.getTipoAcao(),
                progresso == null ? 0 : progresso.getProgressoAtual(),
                progresso != null && progresso.getConcluida(),
                bloqueada,
                progresso != null && progresso.getRecompensaResgatada(),
                missao.getTentativasRecompensa(),
                missao.getXpRecompensa(),
                missao.getAtiva()
        );
    }
}
