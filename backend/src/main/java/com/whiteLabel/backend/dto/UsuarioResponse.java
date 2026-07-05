package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.Usuario;

import java.util.UUID;

public record UsuarioResponse(
        UUID id,
        String nome,
        String telefone,
        Integer xp,
        Integer nivel
) {

    public static UsuarioResponse from(Usuario usuario) {
        return new UsuarioResponse(
                usuario.getId(),
                usuario.getNome(),
                usuario.getTelefone(),
                usuario.getXp(),
                usuario.getNivel()
        );
    }
}
