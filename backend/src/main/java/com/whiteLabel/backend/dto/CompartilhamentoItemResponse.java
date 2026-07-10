package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.CompartilhamentoItem;

public record CompartilhamentoItemResponse(
        String codigo,
        Long produtoId
) {

    public static CompartilhamentoItemResponse from(
            CompartilhamentoItem compartilhamento
    ) {
        return new CompartilhamentoItemResponse(
                compartilhamento.getCodigo(),
                compartilhamento.getProduto().getId()
        );
    }
}
