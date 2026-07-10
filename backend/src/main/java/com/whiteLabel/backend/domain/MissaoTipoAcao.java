package com.whiteLabel.backend.domain;

import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

public enum MissaoTipoAcao {
    CURTIR_ITEM,
    COMPARTILHAR_ITEM,
    // Ao confirmar compra paga, chamar registrarAcao(usuario, COMPRAR_ITEM.name()).
    COMPRAR_ITEM,
    // Ao consumir tentativa real, chamar registrarAcao(usuario, USAR_TENTATIVA.name()).
    USAR_TENTATIVA,
    COMPLETAR_MISSOES,
    ALCANCAR_NIVEL,
    CONVIDAR_PESSOAS,
    BONUS_DIARIO;

    public static Optional<MissaoTipoAcao> from(String valor) {
        if (valor == null) {
            return Optional.empty();
        }

        try {
            return Optional.of(valueOf(valor.trim().toUpperCase(Locale.ROOT)));
        } catch (IllegalArgumentException exception) {
            return Optional.empty();
        }
    }

    public static String valoresPermitidos() {
        return Arrays.stream(values())
                .map(Enum::name)
                .collect(Collectors.joining(", "));
    }
}
