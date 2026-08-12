package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.ProdutoReserva;

import java.time.LocalDateTime;
import java.util.UUID;

public record ProdutoReservaResponse(
        Long id,
        Long produtoId,
        String status,
        LocalDateTime reservadoEm,
        LocalDateTime expiraEm,
        Boolean reservadoPorMim
) {

    public static ProdutoReservaResponse from(ProdutoReserva reserva, UUID usuarioId) {
        return new ProdutoReservaResponse(
                reserva.getId(),
                reserva.getProduto().getId(),
                reserva.getStatus().name(),
                reserva.getReservadoEm(),
                reserva.getExpiraEm(),
                reserva.getUsuario().getId().equals(usuarioId)
        );
    }
}
