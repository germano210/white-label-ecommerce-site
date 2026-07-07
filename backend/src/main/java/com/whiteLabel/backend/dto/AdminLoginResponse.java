package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.Usuario;

public record AdminLoginResponse(
        String token,
        String tipo,
        AdminUsuarioResponse usuario
) {

    public static AdminLoginResponse from(String token, Usuario usuario) {
        return new AdminLoginResponse(
                token,
                "Bearer",
                AdminUsuarioResponse.from(usuario)
        );
    }
}
