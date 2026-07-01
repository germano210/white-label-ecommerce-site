package com.whiteLabel.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MissaoRequest(
        @NotBlank
        String titulo,

        @NotBlank
        String icone,

        @NotNull
        @Min(1)
        @JsonProperty("meta_progresso")
        Integer metaProgresso,

        @NotBlank
        @JsonProperty("tipo_acao")
        String tipoAcao
) {
}
