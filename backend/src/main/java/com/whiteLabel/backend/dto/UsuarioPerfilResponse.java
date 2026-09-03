package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.Usuario;

import java.util.UUID;

public record UsuarioPerfilResponse(
        UUID id,
        String nome,
        String telefone,
        Integer level,
        Integer xpAtual,
        Integer xpParaProximoNivel,
        EnderecoUsuarioResponse endereco
) {

    public static UsuarioPerfilResponse from(Usuario usuario, Integer xpParaProximoNivel) {
        return new UsuarioPerfilResponse(
                usuario.getId(),
                usuario.getNome(),
                usuario.getTelefone(),
                usuario.getNivel(),
                usuario.getXp(),
                xpParaProximoNivel,
                EnderecoUsuarioResponse.from(usuario)
        );
    }
}
