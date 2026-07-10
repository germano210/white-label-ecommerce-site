package com.whiteLabel.backend.domain;

import java.util.Locale;
import java.util.Optional;

public enum MissaoCiclo {
    NORMAL,
    SEMANAL;

    public static Optional<MissaoCiclo> from(String valor) {
        if (valor == null || valor.isBlank()) {
            return Optional.of(NORMAL);
        }

        try {
            return Optional.of(valueOf(valor.trim().toUpperCase(Locale.ROOT)));
        } catch (IllegalArgumentException exception) {
            return Optional.empty();
        }
    }
}
