package com.whiteLabel.backend.dto;

import jakarta.validation.constraints.Size;

public record RoletaMetaRequest(
        @Size(max = 120) String titulo,
        @Size(max = 500) String descricao,
        Integer quantidadeAlvo,
        Integer girosRecompensa,
        Integer ordem,
        Boolean ativa
) {
}
