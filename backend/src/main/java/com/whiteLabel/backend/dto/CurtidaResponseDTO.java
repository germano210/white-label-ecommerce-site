package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.Curtida;

import java.time.LocalDateTime;

public record CurtidaResponseDTO(
        Long id,
        Long produtoId,
        LocalDateTime dataCurtida,
        Integer curtidasCount
) {

    public static CurtidaResponseDTO from(Curtida curtida) {
        return new CurtidaResponseDTO(
                curtida.getId(),
                curtida.getProduto().getId(),
                curtida.getDataCurtida(),
                curtida.getProduto().getCurtidasCount()
        );
    }
}
