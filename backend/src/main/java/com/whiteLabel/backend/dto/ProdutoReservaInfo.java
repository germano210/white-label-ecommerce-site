package com.whiteLabel.backend.dto;

import java.time.LocalDateTime;

public record ProdutoReservaInfo(
        String status,
        Boolean reservado,
        Boolean reservadoPorMim,
        LocalDateTime reservadoAte,
        Long pedidoId,
        String checkoutId,
        String checkoutUrl
) {
}
