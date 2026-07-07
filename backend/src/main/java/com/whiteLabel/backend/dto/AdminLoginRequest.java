package com.whiteLabel.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record AdminLoginRequest(
        @NotBlank
        String email,

        @NotBlank
        String senha
) {
}
