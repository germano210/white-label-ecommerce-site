package com.whiteLabel.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RoletaGiroPrimeiroAcessoVincularRequest(
        @NotBlank @Size(max = 120) String token
) {
}
