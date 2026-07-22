package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.Usuario;

import java.util.UUID;

public record UsuarioPerfilResponse(
        UUID id,
        String nome,
        String telefone,
        Integer level,
        Integer xpAtual,
        Integer xpParaProximoNivel
) {

    public static UsuarioPerfilResponse from(Usuario usuario, Integer xpParaProximoNivel) {
        return new UsuarioPerfilResponse(
                usuario.getId(),
                usuario.getNome(),
                usuario.getTelefone(),
                usuario.getNivel(),
                usuario.getXp(),
                xpParaProximoNivel
        );
    }
}
