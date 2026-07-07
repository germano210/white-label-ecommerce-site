package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.domain.UsuarioRole;

import java.util.UUID;

public record AdminUsuarioResponse(
        UUID id,
        String nome,
        String email,
        UsuarioRole role
) {

    public static AdminUsuarioResponse from(Usuario usuario) {
        return new AdminUsuarioResponse(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getRole()
        );
    }
}
