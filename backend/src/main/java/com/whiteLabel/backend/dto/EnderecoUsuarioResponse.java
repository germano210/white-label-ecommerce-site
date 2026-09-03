package com.whiteLabel.backend.dto;

import com.whiteLabel.backend.domain.Usuario;

public record EnderecoUsuarioResponse(
        String rua,
        String numero,
        String complemento,
        String bairro,
        String cidade,
        String estado,
        String cep
) {

    public static EnderecoUsuarioResponse from(Usuario usuario) {
        return new EnderecoUsuarioResponse(
                usuario.getEnderecoRua(),
                usuario.getEnderecoNumero(),
                usuario.getEnderecoComplemento(),
                usuario.getEnderecoBairro(),
                usuario.getEnderecoCidade(),
                usuario.getEnderecoEstado(),
                usuario.getEnderecoCep()
        );
    }
}
