package com.whiteLabel.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record VerifyOtpRequest(
        @NotBlank @Size(max = 30) String telefone,
        @NotBlank @Pattern(regexp = "\\d{6}", message = "deve conter 6 digitos") String codigo
) {
}
