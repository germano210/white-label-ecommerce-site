package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.Curtida;

import java.time.LocalDateTime;
import java.util.List;

public record CurtidaResponseDTO(
        Long id,
        Long produtoId,
        LocalDateTime dataCurtida,
        Integer curtidasCount,
        List<MissaoResponse> missoes
) {

    public static CurtidaResponseDTO from(Curtida curtida) {
        return from(curtida, List.of());
    }

    public static CurtidaResponseDTO from(Curtida curtida, List<MissaoResponse> missoes) {
        return new CurtidaResponseDTO(
                curtida.getId(),
                curtida.getProduto().getId(),
                curtida.getDataCurtida(),
                curtida.getProduto().getCurtidasCount(),
                missoes == null ? List.of() : missoes
        );
    }
}
