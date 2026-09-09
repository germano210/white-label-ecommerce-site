package com.whiteLabel.backend.service;

import com.whiteLabel.backend.domain.Usuario;

public record IndicacaoConversao(
        Usuario indicador,
        Usuario indicado,
        String codigo,
        boolean novaConversao
) {
}
