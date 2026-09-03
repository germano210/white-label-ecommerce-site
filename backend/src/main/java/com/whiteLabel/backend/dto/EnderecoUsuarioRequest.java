package com.whiteLabel.backend.dto;

import jakarta.validation.constraints.Size;

public record EnderecoUsuarioRequest(
        @Size(max = 180)
        String rua,

        @Size(max = 30)
        String numero,

        @Size(max = 120)
        String complemento,

        @Size(max = 100)
        String bairro,

        @Size(max = 100)
        String cidade,

        @Size(max = 20)
        String estado,

        @Size(max = 20)
        String cep
) {
}
