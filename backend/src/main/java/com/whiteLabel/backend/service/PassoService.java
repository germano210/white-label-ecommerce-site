package com.whiteLabel.backend.service;

import com.whiteLabel.backend.domain.Passo;
import com.whiteLabel.backend.domain.Produto;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.dto.PassoResponseDTO;
import com.whiteLabel.backend.repository.PassoRepository;
import com.whiteLabel.backend.repository.ProdutoRepository;
import com.whiteLabel.backend.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class PassoService {

    private final PassoRepository passoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProdutoRepository produtoRepository;

    public PassoService(
            PassoRepository passoRepository,
            UsuarioRepository usuarioRepository,
            ProdutoRepository produtoRepository
    ) {
        this.passoRepository = passoRepository;
        this.usuarioRepository = usuarioRepository;
        this.produtoRepository = produtoRepository;
    }

    @Transactional
    public PassoResponseDTO passar(Long produtoId) {
        UUID usuarioId = obterUsuarioAutenticadoId();
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Usuario autenticado nao encontrado"
                ));

        Produto produto = produtoRepository.findByIdForUpdate(produtoId)
                .filter(item -> Boolean.TRUE.equals(item.getAtivo()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Produto nao encontrado"
                ));

        if (passoRepository.existsByUsuarioIdAndProdutoId(usuarioId, produtoId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "O usuario ja passou este produto"
            );
        }

        Passo passo = passoRepository.saveAndFlush(new Passo(usuario, produto));
        int passosAtuais = produto.getPassosCount() == null
                ? 0
                : produto.getPassosCount();
        produto.setPassosCount(passosAtuais + 1);
        produtoRepository.save(produto);

        return PassoResponseDTO.from(passo);
    }

    private UUID obterUsuarioAutenticadoId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario nao autenticado");
        }

        try {
            return UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Token de autenticacao invalido",
                    exception
            );
        }
    }
}
