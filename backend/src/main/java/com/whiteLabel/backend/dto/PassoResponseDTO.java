package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.Passo;

import java.time.LocalDateTime;

public record PassoResponseDTO(
        Long id,
        Long produtoId,
        LocalDateTime dataPasso,
        Integer passosCount
) {

    public static PassoResponseDTO from(Passo passo) {
        Integer passosCount = passo.getProduto().getPassosCount();

        return new PassoResponseDTO(
                passo.getId(),
                passo.getProduto().getId(),
                passo.getDataPasso(),
                passosCount == null ? 0 : passosCount
        );
    }
}
