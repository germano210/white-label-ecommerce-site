package com.whiteLabel.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record CheckoutReservaResponse(
        LocalDateTime expiraEm,
        List<ProdutoReservaResponse> reservas,
        List<ProdutoResponseDTO> produtos
) {
}
