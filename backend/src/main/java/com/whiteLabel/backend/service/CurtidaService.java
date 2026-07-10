package com.whiteLabel.backend.service;

import com.whiteLabel.backend.domain.Curtida;
import com.whiteLabel.backend.domain.MissaoTipoAcao;
import com.whiteLabel.backend.domain.Produto;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.dto.CurtidaResponseDTO;
import com.whiteLabel.backend.dto.MissaoResponse;
import com.whiteLabel.backend.repository.CurtidaRepository;
import com.whiteLabel.backend.repository.ProdutoRepository;
import com.whiteLabel.backend.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class CurtidaService {

    private final CurtidaRepository curtidaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProdutoRepository produtoRepository;
    private final MissaoProgressService missaoProgressService;

    public CurtidaService(
            CurtidaRepository curtidaRepository,
            UsuarioRepository usuarioRepository,
            ProdutoRepository produtoRepository,
            MissaoProgressService missaoProgressService
    ) {
        this.curtidaRepository = curtidaRepository;
        this.usuarioRepository = usuarioRepository;
        this.produtoRepository = produtoRepository;
        this.missaoProgressService = missaoProgressService;
    }

    @Transactional
    public CurtidaResponseDTO curtir(Long produtoId) {
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

        if (curtidaRepository.existsByUsuarioIdAndProdutoId(usuarioId, produtoId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "O usuario ja curtiu este produto"
            );
        }

        Curtida curtida = curtidaRepository.saveAndFlush(new Curtida(usuario, produto));
        int curtidasAtuais = produto.getCurtidasCount() == null
                ? 0
                : produto.getCurtidasCount();
        produto.setCurtidasCount(curtidasAtuais + 1);
        produtoRepository.save(produto);

        List<MissaoResponse> missoes =
                missaoProgressService.registrarAcao(
                        usuario,
                        MissaoTipoAcao.CURTIR_ITEM.name()
                );

        return CurtidaResponseDTO.from(curtida, missoes);
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
