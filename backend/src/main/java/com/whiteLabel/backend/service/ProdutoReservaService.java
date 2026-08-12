package com.whiteLabel.backend.service;

import com.whiteLabel.backend.domain.Pagamento;
import com.whiteLabel.backend.domain.PagamentoStatus;
import com.whiteLabel.backend.domain.Pedido;
import com.whiteLabel.backend.domain.PedidoStatus;
import com.whiteLabel.backend.domain.Produto;
import com.whiteLabel.backend.domain.ProdutoReserva;
import com.whiteLabel.backend.domain.ProdutoReservaStatus;
import com.whiteLabel.backend.domain.ProdutoStatus;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.dto.CheckoutResponse;
import com.whiteLabel.backend.dto.CheckoutReservaRequest;
import com.whiteLabel.backend.dto.CheckoutReservaResponse;
import com.whiteLabel.backend.dto.ProdutoReservaInfo;
import com.whiteLabel.backend.dto.ProdutoReservaResponse;
import com.whiteLabel.backend.dto.ProdutoResponseDTO;
import com.whiteLabel.backend.repository.PagamentoRepository;
import com.whiteLabel.backend.repository.PedidoRepository;
import com.whiteLabel.backend.repository.ProdutoRepository;
import com.whiteLabel.backend.repository.ProdutoReservaRepository;
import com.whiteLabel.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ProdutoReservaService {

    private final ProdutoRepository produtoRepository;
    private final ProdutoReservaRepository produtoReservaRepository;
    private final UsuarioRepository usuarioRepository;
    private final PedidoRepository pedidoRepository;
    private final PagamentoRepository pagamentoRepository;
    private final Clock clock;
    private final long reservaMinutos;

    public ProdutoReservaService(
            ProdutoRepository produtoRepository,
            ProdutoReservaRepository produtoReservaRepository,
            UsuarioRepository usuarioRepository,
            PedidoRepository pedidoRepository,
            PagamentoRepository pagamentoRepository,
            @Value("${checkout.reservas.duracao-minutos:15}") long reservaMinutos
    ) {
        this.produtoRepository = produtoRepository;
        this.produtoReservaRepository = produtoReservaRepository;
        this.usuarioRepository = usuarioRepository;
        this.pedidoRepository = pedidoRepository;
        this.pagamentoRepository = pagamentoRepository;
        this.clock = Clock.systemDefaultZone();
        this.reservaMinutos = Math.max(1, reservaMinutos);
    }

    @Transactional
    public CheckoutReservaResponse reservar(CheckoutReservaRequest request) {
        Usuario usuario = buscarUsuarioAutenticado();
        List<ProdutoReserva> reservas = reservarProdutos(usuario, request.produtoIds());
        LocalDateTime expiraEm = reservas.stream()
                .map(ProdutoReserva::getExpiraEm)
                .min(Comparator.naturalOrder())
                .orElse(null);

        return new CheckoutReservaResponse(
                expiraEm,
                reservas.stream()
                        .map(reserva -> ProdutoReservaResponse.from(reserva, usuario.getId()))
                        .toList(),
                reservas.stream()
                        .map(reserva -> ProdutoResponseDTO.from(
                                reserva.getProduto(),
                                new ProdutoReservaInfo(
                                        ProdutoStatus.RESERVADO.name(),
                                        true,
                                        true,
                                        reserva.getExpiraEm(),
                                        null,
                                        null,
                                        null
                                )
                        ))
                        .toList()
        );
    }

    @Transactional
    public List<ProdutoReserva> reservarProdutos(Usuario usuario, Collection<Long> produtoIds) {
        List<Long> ids = normalizarProdutoIds(produtoIds);
        expirarReservasVencidas();

        LocalDateTime agora = LocalDateTime.now(clock);
        LocalDateTime expiraEm = agora.plusMinutes(reservaMinutos);
        List<ProdutoReserva> reservas = new ArrayList<>();

        for (Long produtoId : ids) {
            Produto produto = buscarProdutoParaReserva(produtoId);
            ProdutoReserva reservaAtiva = produtoReservaRepository
                    .findTopByProdutoIdAndStatusOrderByExpiraEmDescIdDesc(
                            produtoId,
                            ProdutoReservaStatus.ATIVA
                    )
                    .orElse(null);
            reservaAtiva = normalizarReservaAtiva(reservaAtiva, produto, agora);

            if (reservaAtiva != null) {
                if (reservaAtiva.getUsuario().getId().equals(usuario.getId())) {
                    reservas.add(reservaAtiva);
                    continue;
                }
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Produto reservado por outro usuario"
                );
            }

            if (produto.getStatus() == ProdutoStatus.RESERVADO) {
                produto.liberarReserva();
            }
            if (!produto.disponivelParaReserva()) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Produto indisponivel para checkout"
                );
            }

            produto.marcarReservado();
            ProdutoReserva reserva = salvarReserva(produto, usuario, agora, expiraEm);
            produtoRepository.save(produto);
            reservas.add(reserva);
        }

        return ordenarPorProdutoIds(reservas, ids);
    }

    private ProdutoReserva salvarReserva(
            Produto produto,
            Usuario usuario,
            LocalDateTime agora,
            LocalDateTime expiraEm
    ) {
        try {
            return produtoReservaRepository.saveAndFlush(new ProdutoReserva(
                    produto,
                    usuario,
                    agora,
                    expiraEm
            ));
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Produto reservado por outro usuario",
                    exception
            );
        }
    }

    @Transactional
    public Optional<CheckoutResponse> buscarCheckoutPendente(Usuario usuario, Long produtoId) {
        if (usuario == null || usuario.getId() == null || produtoId == null) {
            return Optional.empty();
        }

        expirarReservasVencidas();
        LocalDateTime agora = LocalDateTime.now(clock);

        return produtoReservaRepository
                .findTopByUsuarioIdAndProdutoIdAndStatusOrderByExpiraEmDescIdDesc(
                        usuario.getId(),
                        produtoId,
                        ProdutoReservaStatus.ATIVA
                )
                .filter(reserva -> reserva.ativaEm(agora))
                .flatMap(reserva -> buscarPagamentoAguardandoComLinkValido(reserva.getPedido()))
                .map(CheckoutResponse::from);
    }

    @Transactional
    public ReservasCheckout validarReservasParaCheckout(
            Usuario usuario,
            Collection<Long> produtoIds,
            boolean criarSeNecessario
    ) {
        List<Long> ids = normalizarProdutoIds(produtoIds);
        if (criarSeNecessario) {
            reservarProdutos(usuario, ids);
        } else {
            expirarReservasVencidas();
        }

        Map<Long, ProdutoReserva> reservasPorProduto = produtoReservaRepository
                .findByUsuarioIdAndProdutoIdInAndStatus(
                        usuario.getId(),
                        ids,
                        ProdutoReservaStatus.ATIVA
                )
                .stream()
                .filter(reserva -> reserva.ativaEm(LocalDateTime.now(clock)))
                .collect(Collectors.toMap(
                        reserva -> reserva.getProduto().getId(),
                        Function.identity(),
                        (primeira, segunda) -> primeira
                ));

        List<Produto> produtos = new ArrayList<>();
        List<ProdutoReserva> reservas = new ArrayList<>();

        for (Long produtoId : ids) {
            Produto produto = buscarProdutoParaCheckout(produtoId);
            ProdutoReserva reserva = reservasPorProduto.get(produtoId);
            if (reserva == null) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Produto nao esta reservado para este usuario"
                );
            }
            if (reserva.getPedido() != null
                    && (reserva.getPedido().getStatus() == PedidoStatus.AGUARDANDO_PAGAMENTO
                    || reserva.getPedido().getStatus() == PedidoStatus.PAGO)) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Produto ja possui checkout em andamento"
                );
            }
            produtos.add(produto);
            reservas.add(reserva);
        }

        return new ReservasCheckout(produtos, reservas);
    }

    @Transactional
    public void vincularPedido(List<ProdutoReserva> reservas, Pedido pedido) {
        reservas.forEach(reserva -> reserva.vincularPedido(pedido));
        produtoReservaRepository.saveAll(reservas);
    }

    @Transactional
    public void finalizarReservasDoPedido(Pedido pedido) {
        LocalDateTime agora = LocalDateTime.now(clock);
        List<ProdutoReserva> reservas = produtoReservaRepository.findByPedidoId(pedido.getId());
        if (reservas.isEmpty()) {
            List<Produto> produtosDoPedido = pedido.getItens()
                    .stream()
                    .map(item -> item.getProduto())
                    .toList();
            produtosDoPedido.forEach(Produto::marcarVendido);
            produtoRepository.saveAll(produtosDoPedido);
            return;
        }

        reservas.stream()
                .filter(reserva -> reserva.getStatus() == ProdutoReservaStatus.ATIVA)
                .forEach(reserva -> {
                    reserva.finalizar(agora);
                    reserva.getProduto().marcarVendido();
                });

        produtoReservaRepository.saveAll(reservas);
        produtoRepository.saveAll(reservas.stream()
                .map(ProdutoReserva::getProduto)
                .toList());
    }

    @Transactional
    public void liberarReservasDoPedido(Pedido pedido, boolean expirada) {
        LocalDateTime agora = LocalDateTime.now(clock);
        List<ProdutoReserva> reservas = produtoReservaRepository.findByPedidoId(pedido.getId());
        reservas.stream()
                .filter(reserva -> reserva.getStatus() == ProdutoReservaStatus.ATIVA)
                .forEach(reserva -> {
                    if (expirada) {
                        reserva.expirar(agora);
                    } else {
                        reserva.cancelar(agora);
                    }
                    reserva.getProduto().liberarReserva();
                });

        produtoReservaRepository.saveAll(reservas);
        produtoRepository.saveAll(reservas.stream()
                .map(ProdutoReserva::getProduto)
                .toList());
    }

    @Transactional
    @Scheduled(fixedDelayString = "${checkout.reservas.expiracao-intervalo-ms:60000}")
    public void expirarReservasVencidas() {
        LocalDateTime agora = LocalDateTime.now(clock);
        List<ProdutoReserva> vencidas = produtoReservaRepository.findByStatusAndExpiraEmLessThanEqual(
                ProdutoReservaStatus.ATIVA,
                agora
        );
        List<Pedido> pedidosExpirados = new ArrayList<>();
        List<Pagamento> pagamentosExpirados = new ArrayList<>();

        vencidas.forEach(reserva -> expirarReservaComCheckoutPendente(
                reserva,
                agora,
                pedidosExpirados,
                pagamentosExpirados
        ));
        produtoReservaRepository.saveAll(vencidas);
        pedidoRepository.saveAll(pedidosExpirados);
        pagamentoRepository.saveAll(pagamentosExpirados);
        produtoRepository.saveAll(vencidas.stream()
                .map(ProdutoReserva::getProduto)
                .toList());
    }

    @Transactional
    public Map<Long, ProdutoReservaInfo> buscarInfosReserva(List<Produto> produtos) {
        expirarReservasVencidas();
        if (produtos == null || produtos.isEmpty()) {
            return Map.of();
        }

        LocalDateTime agora = LocalDateTime.now(clock);
        Optional<UUID> usuarioId = obterUsuarioAutenticadoIdOptional();
        List<Long> produtoIds = produtos.stream()
                .map(Produto::getId)
                .filter(Objects::nonNull)
                .toList();
        Map<Long, ProdutoReserva> reservasAtivas = produtoReservaRepository
                .findByProdutoIdInAndStatus(produtoIds, ProdutoReservaStatus.ATIVA)
                .stream()
                .filter(reserva -> reserva.ativaEm(agora))
                .collect(Collectors.toMap(
                        reserva -> reserva.getProduto().getId(),
                        Function.identity(),
                        (primeira, segunda) -> primeira
                ));

        return produtos.stream()
                .collect(Collectors.toMap(
                        Produto::getId,
                        produto -> montarInfo(produto, reservasAtivas.get(produto.getId()), usuarioId)
                ));
    }

    private ProdutoReserva normalizarReservaAtiva(
            ProdutoReserva reserva,
            Produto produto,
            LocalDateTime agora
    ) {
        if (reserva == null) {
            return null;
        }

        if (!reserva.ativaEm(agora)) {
            List<Pedido> pedidosExpirados = new ArrayList<>();
            List<Pagamento> pagamentosExpirados = new ArrayList<>();
            expirarReservaComCheckoutPendente(reserva, agora, pedidosExpirados, pagamentosExpirados);
            produtoReservaRepository.save(reserva);
            pedidoRepository.saveAll(pedidosExpirados);
            pagamentoRepository.saveAll(pagamentosExpirados);
            produtoRepository.save(produto);
            return null;
        }

        Pedido pedido = reserva.getPedido();
        if (pedido == null) {
            return reserva;
        }

        if (pedido.getStatus() == PedidoStatus.AGUARDANDO_PAGAMENTO) {
            if (buscarPagamentoAguardandoComLinkValido(pedido).isPresent()) {
                return reserva;
            }
            List<Pedido> pedidosExpirados = new ArrayList<>();
            List<Pagamento> pagamentosExpirados = new ArrayList<>();
            expirarReservaComCheckoutPendente(reserva, agora, pedidosExpirados, pagamentosExpirados);
            produtoReservaRepository.save(reserva);
            pedidoRepository.saveAll(pedidosExpirados);
            pagamentoRepository.saveAll(pagamentosExpirados);
            produtoRepository.save(produto);
            return null;
        }

        if (pedido.getStatus() == PedidoStatus.FALHOU || pedido.getStatus() == PedidoStatus.CANCELADO) {
            reserva.cancelar(agora);
            produto.liberarReserva();
            produtoReservaRepository.save(reserva);
            produtoRepository.save(produto);
            return null;
        }

        if (pedido.getStatus() == PedidoStatus.EXPIRADO) {
            reserva.expirar(agora);
            produto.liberarReserva();
            produtoReservaRepository.save(reserva);
            produtoRepository.save(produto);
            return null;
        }

        return reserva;
    }

    private void expirarReservaComCheckoutPendente(
            ProdutoReserva reserva,
            LocalDateTime agora,
            List<Pedido> pedidosExpirados,
            List<Pagamento> pagamentosExpirados
    ) {
        reserva.expirar(agora);
        reserva.getProduto().liberarReserva();

        Pedido pedido = reserva.getPedido();
        if (pedido == null || pedido.getStatus() != PedidoStatus.AGUARDANDO_PAGAMENTO) {
            return;
        }

        pedido.expirar();
        pedidosExpirados.add(pedido);
        pagamentoRepository.findTopByPedidoIdOrderByDataCriacaoDescIdDesc(pedido.getId())
                .filter(this::pagamentoAguardando)
                .ifPresent(pagamento -> {
                    pagamento.expirar();
                    pagamentosExpirados.add(pagamento);
                });
    }

    private Optional<Pagamento> buscarPagamentoAguardandoComLinkValido(Pedido pedido) {
        if (pedido == null || pedido.getStatus() != PedidoStatus.AGUARDANDO_PAGAMENTO) {
            return Optional.empty();
        }

        return pagamentoRepository.findTopByPedidoIdOrderByDataCriacaoDescIdDesc(pedido.getId())
                .filter(this::pagamentoAguardando)
                .filter(pagamento -> pagamento.getCheckoutUrl() != null
                        && !pagamento.getCheckoutUrl().isBlank());
    }

    private boolean pagamentoAguardando(Pagamento pagamento) {
        return pagamento.getStatus() == PagamentoStatus.PENDENTE
                || pagamento.getStatus() == PagamentoStatus.AGUARDANDO_PAGAMENTO;
    }

    private ProdutoReservaInfo montarInfo(
            Produto produto,
            ProdutoReserva reserva,
            Optional<UUID> usuarioId
    ) {
        boolean reservado = reserva != null;
        boolean reservadoPorMim = reservado
                && usuarioId.isPresent()
                && reserva.getUsuario().getId().equals(usuarioId.get());
        String status = reservado
                ? ProdutoStatus.RESERVADO.name()
                : statusSemReservaAtiva(produto).name();
        Optional<Pagamento> checkoutPendente = reservadoPorMim
                ? buscarPagamentoAguardandoComLinkValido(reserva.getPedido())
                : Optional.empty();

        return new ProdutoReservaInfo(
                status,
                reservado,
                reservadoPorMim,
                reservado ? reserva.getExpiraEm() : null,
                checkoutPendente.map(pagamento -> pagamento.getPedido().getId()).orElse(null),
                checkoutPendente.map(Pagamento::getCheckoutId).orElse(null),
                checkoutPendente.map(Pagamento::getCheckoutUrl).orElse(null)
        );
    }

    private ProdutoStatus statusSemReservaAtiva(Produto produto) {
        ProdutoStatus status = produto.getStatus();
        return status == ProdutoStatus.RESERVADO ? ProdutoStatus.DISPONIVEL : status;
    }

    private Produto buscarProdutoParaReserva(Long produtoId) {
        Produto produto = produtoRepository.findByIdForUpdate(produtoId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Produto nao encontrado"
                ));
        validarProdutoNaoInativo(produto);
        return produto;
    }

    private Produto buscarProdutoParaCheckout(Long produtoId) {
        Produto produto = produtoRepository.findByIdForUpdate(produtoId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Produto nao encontrado"
                ));
        validarProdutoNaoInativo(produto);
        if (produto.getStatus() == ProdutoStatus.VENDIDO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Produto ja vendido");
        }
        return produto;
    }

    private void validarProdutoNaoInativo(Produto produto) {
        if (produto.getStatus() == ProdutoStatus.VENDIDO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Produto ja vendido");
        }
        if (!Boolean.TRUE.equals(produto.getAtivo()) || produto.getStatus() == ProdutoStatus.INATIVO) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto nao encontrado");
        }
    }

    private List<Long> normalizarProdutoIds(Collection<Long> produtoIds) {
        if (produtoIds == null || produtoIds.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe um produto para checkout"
            );
        }

        List<Long> ids = produtoIds.stream()
                .filter(Objects::nonNull)
                .toList();
        if (ids.size() != produtoIds.size()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Lista de produtos invalida"
            );
        }

        if (ids.size() != 1) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Checkout permite apenas um produto por vez"
            );
        }

        return List.copyOf(ids);
    }

    private List<ProdutoReserva> ordenarPorProdutoIds(
            List<ProdutoReserva> reservas,
            List<Long> produtoIds
    ) {
        Map<Long, Integer> ordem = produtoIds.stream()
                .collect(Collectors.toMap(
                        Function.identity(),
                        produtoId -> produtoIds.indexOf(produtoId)
                ));

        return reservas.stream()
                .sorted(Comparator.comparing(reserva -> ordem.get(reserva.getProduto().getId())))
                .toList();
    }

    private Usuario buscarUsuarioAutenticado() {
        UUID usuarioId = obterUsuarioAutenticadoIdOptional()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Usuario nao autenticado"
                ));

        return usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Usuario autenticado nao encontrado"
                ));
    }

    private Optional<UUID> obterUsuarioAutenticadoIdOptional() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            return Optional.empty();
        }

        try {
            return Optional.of(UUID.fromString(authentication.getName()));
        } catch (IllegalArgumentException exception) {
            return Optional.empty();
        }
    }

    public record ReservasCheckout(
            List<Produto> produtos,
            List<ProdutoReserva> reservas
    ) {
    }
}
