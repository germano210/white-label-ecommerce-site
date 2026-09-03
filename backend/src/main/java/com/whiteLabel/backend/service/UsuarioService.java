package com.whiteLabel.backend.service;

import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.dto.EnderecoUsuarioRequest;
import com.whiteLabel.backend.dto.UsuarioPerfilResponse;
import com.whiteLabel.backend.dto.UsuarioResgateResponse;
import com.whiteLabel.backend.repository.PagamentoRepository;
import com.whiteLabel.backend.repository.PedidoRepository;
import com.whiteLabel.backend.repository.UsuarioRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Objects;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
public class UsuarioService {

    private static final double CHANCE_BONUS_CRITICO = 0.20;
    private static final double MULTIPLICADOR_BONUS_CRITICO = 1.5;

    private final UsuarioRepository usuarioRepository;
    private final MissaoSemanalService missaoSemanalService;
    private final PedidoRepository pedidoRepository;
    private final PagamentoRepository pagamentoRepository;

    public UsuarioService(
            UsuarioRepository usuarioRepository,
            MissaoSemanalService missaoSemanalService,
            PedidoRepository pedidoRepository,
            PagamentoRepository pagamentoRepository
    ) {
        this.usuarioRepository = usuarioRepository;
        this.missaoSemanalService = missaoSemanalService;
        this.pedidoRepository = pedidoRepository;
        this.pagamentoRepository = pagamentoRepository;
    }

    @Transactional(readOnly = true)
    public UsuarioPerfilResponse buscarPerfilAutenticado() {
        UUID usuarioId = obterUsuarioAutenticadoId();
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Usuario autenticado nao encontrado"
                ));

        return UsuarioPerfilResponse.from(
                usuario,
                calcularXpParaProximoNivel(usuario.getNivel())
        );
    }

    @Transactional
    public UsuarioPerfilResponse atualizarEnderecoAutenticado(EnderecoUsuarioRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Endereco e obrigatorio");
        }

        UUID usuarioId = obterUsuarioAutenticadoId();
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Usuario autenticado nao encontrado"
                ));

        usuario.setEnderecoRua(normalizarTexto(request.rua()));
        usuario.setEnderecoNumero(normalizarTexto(request.numero()));
        usuario.setEnderecoComplemento(normalizarTexto(request.complemento()));
        usuario.setEnderecoBairro(normalizarTexto(request.bairro()));
        usuario.setEnderecoCidade(normalizarTexto(request.cidade()));
        usuario.setEnderecoEstado(normalizarEstado(request.estado()));
        usuario.setEnderecoCep(normalizarCep(request.cep()));

        Usuario usuarioAtualizado = usuarioRepository.save(usuario);
        return UsuarioPerfilResponse.from(
                usuarioAtualizado,
                calcularXpParaProximoNivel(usuarioAtualizado.getNivel())
        );
    }

    @Transactional(readOnly = true)
    public List<UsuarioResgateResponse> listarResgatesAutenticados() {
        UUID usuarioId = obterUsuarioAutenticadoId();

        return pedidoRepository.findDistinctByUsuarioIdOrderByDataCriacaoDescIdDesc(usuarioId)
                .stream()
                .flatMap(pedido -> {
                    var pagamento = pagamentoRepository
                            .findTopByPedidoIdOrderByDataCriacaoDescIdDesc(pedido.getId())
                            .orElse(null);

                    return pedido.getItens()
                            .stream()
                            .map(item -> UsuarioResgateResponse.from(pedido, item, pagamento));
                })
                .toList();
    }

    /**
     * Aplica uma progressao hibrida baseada em RPE e JND: nos niveis 1 a 6,
     * a curva usa crescimento 1.5 para manter reforcos frequentes e surpresa positiva;
     * nos niveis 7 a 9, a curva usa crescimento 2.0 para revelar grind de forma gradual;
     * a partir do nivel 10, a curva usa crescimento 2.5 para criar atraso perceptivo de JND,
     * onde o usuario precisa de esforco muito maior para notar a proxima mudanca relevante.
     */
    @Transactional
    public Usuario adicionarXp(Usuario usuario, Integer valorBase, Integer peso) {
        Objects.requireNonNull(usuario, "usuario nao pode ser nulo");
        Objects.requireNonNull(valorBase, "valorBase nao pode ser nulo");
        Objects.requireNonNull(peso, "peso nao pode ser nulo");

        int xpGanho = valorBase * peso;
        if (Math.random() <= CHANCE_BONUS_CRITICO) {
            xpGanho = (int) (xpGanho * MULTIPLICADOR_BONUS_CRITICO);
            log.info(
                    "Bonus Critico de RPE ativado para usuario {} com ganho final de {} XP",
                    usuario.getId(),
                    xpGanho
            );
        }

        int novoXp = usuario.getXp() + xpGanho;
        int nivelAnterior = usuario.getNivel();

        usuario.setXp(novoXp);
        while (usuario.getXp() >= calcularXpNecessarioParaProximoNivel(usuario.getNivel())) {
            usuario.setNivel(usuario.getNivel() + 1);
        }

        Usuario usuarioAtualizado = usuarioRepository.save(usuario);
        if (usuarioAtualizado.getNivel() > nivelAnterior) {
            missaoSemanalService.sincronizarNivel(usuarioAtualizado);
        }

        return usuarioAtualizado;
    }

    public Integer calcularXpParaProximoNivel(Integer nivelAtual) {
        return (int) Math.ceil(calcularXpNecessarioParaProximoNivel(nivelAtual));
    }

    private String normalizarTexto(String valor) {
        if (valor == null) {
            return null;
        }

        String normalizado = valor.trim();
        return normalizado.isEmpty() ? null : normalizado;
    }

    private String normalizarEstado(String estado) {
        String normalizado = normalizarTexto(estado);
        if (normalizado == null) {
            return null;
        }
        if (!normalizado.matches("[A-Za-z]{2}")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado deve ter 2 letras");
        }

        return normalizado.toUpperCase(Locale.ROOT);
    }

    private String normalizarCep(String cep) {
        String normalizado = normalizarTexto(cep);
        if (normalizado == null) {
            return null;
        }

        String apenasDigitos = normalizado.replaceAll("\\D", "");
        if (apenasDigitos.length() > 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CEP deve ter ate 8 digitos");
        }

        return apenasDigitos.isEmpty() ? null : apenasDigitos;
    }

    private double calcularXpNecessarioParaProximoNivel(Integer nivelAtual) {
        int nivel = Math.max(1, nivelAtual == null ? 1 : nivelAtual);

        if (nivel <= 6) {
            return 100 * Math.pow(nivel, 1.5);
        }

        if (nivel <= 9) {
            return 100 * Math.pow(nivel, 2.0);
        }

        return 100 * Math.pow(nivel, 2.5);
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
