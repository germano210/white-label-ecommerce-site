package com.whiteLabel.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RequestOtpRequest(
        @NotBlank @Size(max = 30) String telefone,
        @Size(max = 150) String nome,
        @Size(max = 40) String codigoIndicacao
) {

    public RequestOtpRequest(String telefone, String nome) {
        this(telefone, nome, null);
    }
}
