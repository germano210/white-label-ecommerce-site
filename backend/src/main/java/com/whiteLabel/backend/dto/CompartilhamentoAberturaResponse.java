package com.whiteLabel.backend.dto;

import java.util.List;

public record CompartilhamentoAberturaResponse(
        String codigo,
        Long produtoId,
        Boolean contabilizada,
        List<MissaoResponse> missoes
) {
}
