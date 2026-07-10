package com.whiteLabel.backend.service;

import com.whiteLabel.backend.domain.CompartilhamentoAbertura;
import com.whiteLabel.backend.domain.CompartilhamentoItem;
import com.whiteLabel.backend.domain.MissaoTipoAcao;
import com.whiteLabel.backend.domain.Produto;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.dto.CompartilhamentoAberturaResponse;
import com.whiteLabel.backend.dto.CompartilhamentoItemResponse;
import com.whiteLabel.backend.dto.MissaoResponse;
import com.whiteLabel.backend.repository.CompartilhamentoAberturaRepository;
import com.whiteLabel.backend.repository.CompartilhamentoItemRepository;
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
public class CompartilhamentoService {

    private static final int TAMANHO_CODIGO = 16;

    private final CompartilhamentoItemRepository compartilhamentoItemRepository;
    private final CompartilhamentoAberturaRepository compartilhamentoAberturaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProdutoRepository produtoRepository;
    private final MissaoProgressService missaoProgressService;
    private final MissaoSemanalService missaoSemanalService;

    public CompartilhamentoService(
            CompartilhamentoItemRepository compartilhamentoItemRepository,
            CompartilhamentoAberturaRepository compartilhamentoAberturaRepository,
            UsuarioRepository usuarioRepository,
            ProdutoRepository produtoRepository,
            MissaoProgressService missaoProgressService,
            MissaoSemanalService missaoSemanalService
    ) {
        this.compartilhamentoItemRepository = compartilhamentoItemRepository;
        this.compartilhamentoAberturaRepository = compartilhamentoAberturaRepository;
        this.usuarioRepository = usuarioRepository;
        this.produtoRepository = produtoRepository;
        this.missaoProgressService = missaoProgressService;
        this.missaoSemanalService = missaoSemanalService;
    }

    @Transactional
    public CompartilhamentoItemResponse gerarLinkProduto(Long produtoId) {
        Usuario usuarioOrigem = buscarUsuarioAutenticado();
        Produto produto = produtoRepository.findById(produtoId)
                .filter(item -> Boolean.TRUE.equals(item.getAtivo()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Produto nao encontrado"
                ));

        CompartilhamentoItem compartilhamento = new CompartilhamentoItem(
                gerarCodigoUnico(),
                usuarioOrigem,
                produto
        );

        return CompartilhamentoItemResponse.from(
                compartilhamentoItemRepository.save(compartilhamento)
        );
    }

    @Transactional
    public CompartilhamentoAberturaResponse abrirLink(String codigo) {
        Usuario visitante = buscarUsuarioAutenticado();
        CompartilhamentoItem compartilhamento = compartilhamentoItemRepository
                .findByCodigoAndAtivoTrue(codigo)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Compartilhamento nao encontrado"
                ));
        Long produtoId = compartilhamento.getProduto().getId();
        Usuario usuarioOrigem = compartilhamento.getUsuarioOrigem();

        if (usuarioOrigem.getId().equals(visitante.getId())) {
            return new CompartilhamentoAberturaResponse(
                    compartilhamento.getCodigo(),
                    produtoId,
                    false,
                    List.of()
            );
        }

        boolean aberturaExistente = compartilhamentoAberturaRepository
                .existsByCompartilhamentoIdAndUsuarioVisitanteId(
                        compartilhamento.getId(),
                        visitante.getId()
                );

        if (aberturaExistente) {
            return new CompartilhamentoAberturaResponse(
                    compartilhamento.getCodigo(),
                    produtoId,
                    false,
                    List.of()
            );
        }

        compartilhamentoAberturaRepository.save(
                new CompartilhamentoAbertura(compartilhamento, visitante)
        );
        List<MissaoResponse> missoes = missaoProgressService.registrarAcao(
                usuarioOrigem,
                MissaoTipoAcao.COMPARTILHAR_ITEM.name()
        );
        missaoSemanalService.registrarAcao(
                usuarioOrigem,
                MissaoTipoAcao.CONVIDAR_PESSOAS.name()
        );

        return new CompartilhamentoAberturaResponse(
                compartilhamento.getCodigo(),
                produtoId,
                true,
                missoes
        );
    }

    private Usuario buscarUsuarioAutenticado() {
        UUID usuarioId = obterUsuarioAutenticadoId();

        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Usuario autenticado nao encontrado"
                ));
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

    private String gerarCodigoUnico() {
        String codigo;

        do {
            codigo = UUID.randomUUID()
                    .toString()
                    .replace("-", "")
                    .substring(0, TAMANHO_CODIGO);
        } while (compartilhamentoItemRepository.existsByCodigo(codigo));

        return codigo;
    }
}
