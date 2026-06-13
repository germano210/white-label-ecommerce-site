package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.Usuario;

public record TokenResponse(
        String token,
        String tipo,
        UsuarioResponse usuario
) {

    public static TokenResponse from(String token, Usuario usuario) {
        return new TokenResponse(token, "Bearer", UsuarioResponse.from(usuario));
    }
}
