package com.whiteLabel.backend.service;

import com.whiteLabel.backend.domain.Pagamento;
import com.whiteLabel.backend.domain.Pedido;
import com.whiteLabel.backend.domain.PedidoStatus;
import com.whiteLabel.backend.domain.Produto;
import com.whiteLabel.backend.domain.RoletaGiro;
import com.whiteLabel.backend.domain.RoletaGiroStatus;
import com.whiteLabel.backend.domain.RoletaTipoPremio;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.domain.UsuarioRole;
import com.whiteLabel.backend.dto.CheckoutProdutosRequest;
import com.whiteLabel.backend.dto.CheckoutResponse;
import com.whiteLabel.backend.dto.CheckoutStatusResponse;
import com.whiteLabel.backend.dto.CriarCheckoutRequest;
import com.whiteLabel.backend.dto.InfinitePayLinkRequest;
import com.whiteLabel.backend.dto.InfinitePayLinkResponse;
import com.whiteLabel.backend.repository.PagamentoRepository;
import com.whiteLabel.backend.repository.PedidoRepository;
import com.whiteLabel.backend.repository.RoletaGiroRepository;
import com.whiteLabel.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class PedidoService {

    private static final String PROVIDER_INFINITEPAY = "INFINITEPAY";

    private final UsuarioRepository usuarioRepository;
    private final PedidoRepository pedidoRepository;
    private final PagamentoRepository pagamentoRepository;
    private final ProdutoReservaService produtoReservaService;
    private final RoletaGiroRepository roletaGiroRepository;
    private final InfinitePayClient infinitePayClient;
    private final String infinitePayHandle;
    private final String infinitePayRedirectUrl;
    private final String infinitePayWebhookUrl;

    public PedidoService(
            UsuarioRepository usuarioRepository,
            PedidoRepository pedidoRepository,
            PagamentoRepository pagamentoRepository,
            ProdutoReservaService produtoReservaService,
            RoletaGiroRepository roletaGiroRepository,
            InfinitePayClient infinitePayClient,
            @Value("${infinitepay.handle}") String infinitePayHandle,
            @Value("${infinitepay.redirect-url}") String infinitePayRedirectUrl,
            @Value("${infinitepay.webhook-url}") String infinitePayWebhookUrl
    ) {
        this.usuarioRepository = usuarioRepository;
        this.pedidoRepository = pedidoRepository;
        this.pagamentoRepository = pagamentoRepository;
        this.produtoReservaService = produtoReservaService;
        this.roletaGiroRepository = roletaGiroRepository;
        this.infinitePayClient = infinitePayClient;
        this.infinitePayHandle = infinitePayHandle;
        this.infinitePayRedirectUrl = infinitePayRedirectUrl;
        this.infinitePayWebhookUrl = infinitePayWebhookUrl;
    }

    @Transactional
    public CheckoutResponse criarCheckout(CriarCheckoutRequest request) {
        Usuario usuario = buscarUsuarioAutenticado();
        validarCheckoutComProdutoUnico(request == null ? null : request.itens());
        List<Long> produtoIds = request.itens()
                .stream()
                .peek(item -> {
                    if (item == null || item.produtoId() == null) {
                        throw new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "Lista de produtos invalida"
                        );
                    }
                    if (item.quantidade() == null || item.quantidade() != 1) {
                        throw new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "Produtos de brecho sao itens unicos"
                        );
                    }
                })
                .map(CriarCheckoutRequest.Item::produtoId)
                .toList();

        return criarCheckoutProdutos(usuario, produtoIds, true, null);
    }

    @Transactional
    public CheckoutResponse criarCheckoutProdutos(CheckoutProdutosRequest request) {
        validarCheckoutComProdutoUnico(request == null ? null : request.produtoIds());
        return criarCheckoutProdutos(buscarUsuarioAutenticado(), request.produtoIds(), false, null);
    }

    @Transactional
    public CheckoutResponse criarCheckoutProduto(Long produtoId) {
        Usuario usuario = buscarUsuarioAutenticado();
        return criarCheckoutProdutos(usuario, List.of(produtoId), true, null);
    }

    @Transactional(readOnly = true)
    public CheckoutStatusResponse consultarStatusCheckout(Long pedidoId) {
        Usuario usuario = buscarUsuarioAutenticado();
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Pedido nao encontrado"
                ));

        boolean pertenceAoUsuario = pedido.getUsuario().getId().equals(usuario.getId());
        boolean usuarioAdmin = usuario.getRole() == UsuarioRole.ADMIN;

        if (!pertenceAoUsuario && !usuarioAdmin) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Pedido pertence a outro usuario"
            );
        }

        Pagamento pagamento = pagamentoRepository
                .findTopByPedidoIdOrderByDataCriacaoDescIdDesc(pedidoId)
                .orElse(null);

        return CheckoutStatusResponse.from(pedido, pagamento);
    }

    @Transactional
    public CheckoutResponse criarCheckoutProdutoRoleta(
            Usuario usuario,
            Produto produto,
            RoletaGiro premioAtual
    ) {
        Optional<CheckoutResponse> checkoutPendente =
                produtoReservaService.buscarCheckoutPendente(usuario, produto.getId());
        if (checkoutPendente.isPresent()) {
            return checkoutPendente.get();
        }

        if (premioAtual != null && pedidoRepository.existsByRoletaGiroIdAndStatusIn(
                premioAtual.getId(),
                List.of(PedidoStatus.AGUARDANDO_PAGAMENTO, PedidoStatus.PAGO)
        )) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Premio atual ja esta vinculado a outro checkout"
            );
        }

        return criarCheckoutProdutos(usuario, List.of(produto.getId()), true, premioAtual);
    }

    private CheckoutResponse criarCheckoutProdutos(
            Usuario usuario,
            List<Long> produtoIds,
            boolean criarReservaSeNecessario,
            RoletaGiro premioRoleta
    ) {
        validarCheckoutComProdutoUnico(produtoIds);
        Long produtoId = produtoIds.get(0);
        Optional<CheckoutResponse> checkoutPendente =
                produtoReservaService.buscarCheckoutPendente(usuario, produtoId);
        if (checkoutPendente.isPresent()) {
            return checkoutPendente.get();
        }

        ProdutoReservaService.ReservasCheckout reservasCheckout =
                produtoReservaService.validarReservasParaCheckout(
                        usuario,
                        produtoIds,
                        criarReservaSeNecessario
                );
        List<Produto> produtos = reservasCheckout.produtos();
        RoletaGiro premioAplicavel = premioRoleta == null
                ? obterPremioAtual(usuario).orElse(null)
                : premioRoleta;
        validarPremioDisponivelParaCheckout(premioAplicavel);
        CheckoutCalculado calculo = calcularCheckout(produtos, premioAplicavel);

        if (calculo.precoFinal().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Checkout sem preco valido para pagamento"
            );
        }

        Pedido pedido = new Pedido(usuario);
        calculo.itens().forEach(item -> pedido.adicionarItem(
                item.produto(),
                1,
                item.precoFinal()
        ));
        pedido.registrarCheckoutProdutos(
                produtos,
                calculo.produtoComDesconto(),
                calculo.precoOriginal(),
                calculo.descontoAplicado(),
                calculo.precoFinal()
        );
        pedido.vincularPremioRoleta(calculo.descontoAplicado().compareTo(BigDecimal.ZERO) > 0
                ? premioAplicavel
                : null);
        pedido.aguardarPagamento();

        Pedido pedidoSalvo = pedidoRepository.saveAndFlush(pedido);
        pedidoSalvo.definirOrderNsu(pedidoSalvo.getId().toString());
        pedidoSalvo = pedidoRepository.saveAndFlush(pedidoSalvo);
        produtoReservaService.vincularPedido(reservasCheckout.reservas(), pedidoSalvo);

        Pagamento pagamento = pagamentoRepository.save(new Pagamento(
                pedidoSalvo,
                pedidoSalvo.getOrderNsu(),
                PROVIDER_INFINITEPAY
        ));

        InfinitePayLinkResponse link = infinitePayClient.criarLink(
                montarInfinitePayRequest(pedidoSalvo, calculo.itens())
        );

        if (link == null || link.url() == null || link.url().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "InfinitePay nao retornou URL de checkout"
            );
        }

        pagamento.definirCheckoutUrl(link.url());
        pagamento = pagamentoRepository.saveAndFlush(pagamento);

        return CheckoutResponse.from(pagamento);
    }

    private InfinitePayLinkRequest montarInfinitePayRequest(
            Pedido pedido,
            List<ItemCheckoutCalculado> itens
    ) {
        validarCheckoutComProdutoUnico(itens);
        ItemCheckoutCalculado item = itens.get(0);

        return new InfinitePayLinkRequest(
                infinitePayHandle,
                infinitePayRedirectUrl,
                infinitePayWebhookUrl,
                pedido.getOrderNsu(),
                List.of(new InfinitePayLinkRequest.Item(
                        1,
                        converterParaCentavos(item.precoFinal()),
                        item.produto().getNome()
                ))
        );
    }

    private void validarCheckoutComProdutoUnico(Collection<?> itens) {
        if (itens == null || itens.size() != 1) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Checkout permite apenas um produto por vez"
            );
        }
    }

    private Optional<RoletaGiro> obterPremioAtual(Usuario usuario) {
        List<RoletaGiro> pendentes = roletaGiroRepository.findByUsuarioIdAndStatusForUpdate(
                usuario.getId(),
                RoletaGiroStatus.PENDENTE
        );

        if (pendentes.isEmpty()) {
            return Optional.empty();
        }

        RoletaGiro premioAtual = pendentes.get(0);
        if (pendentes.size() > 1) {
            pendentes.stream()
                    .skip(1)
                    .forEach(RoletaGiro::descartar);
            roletaGiroRepository.saveAll(pendentes.subList(1, pendentes.size()));
        }

        return Optional.of(premioAtual);
    }

    private void validarPremioDisponivelParaCheckout(RoletaGiro premioAtual) {
        if (premioAtual == null) {
            return;
        }
        if (pedidoRepository.existsByRoletaGiroIdAndStatusIn(
                premioAtual.getId(),
                List.of(PedidoStatus.AGUARDANDO_PAGAMENTO, PedidoStatus.PAGO)
        )) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Premio atual ja esta vinculado a outro checkout"
            );
        }
    }

    private CheckoutCalculado calcularCheckout(
            List<Produto> produtos,
            RoletaGiro premioRoleta
    ) {
        List<Produto> produtosOrdenados = produtos == null ? List.of() : produtos;
        BigDecimal precoOriginal = produtosOrdenados.stream()
                .map(produto -> normalizarPreco(produto.getPrecoVenda()))
                .reduce(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP), BigDecimal::add);
        Produto produtoComDesconto = escolherProdutoParaDesconto(produtosOrdenados, premioRoleta).orElse(null);
        BigDecimal descontoAplicado = produtoComDesconto == null
                ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
                : calcularDescontoAplicavel(produtoComDesconto, premioRoleta);
        Map<Long, Produto> produtoComDescontoPorId = produtoComDesconto == null
                ? Map.of()
                : Map.of(produtoComDesconto.getId(), produtoComDesconto);

        List<ItemCheckoutCalculado> itens = produtosOrdenados.stream()
                .map(produto -> {
                    BigDecimal precoProduto = normalizarPreco(produto.getPrecoVenda());
                    BigDecimal descontoProduto = produtoComDescontoPorId.containsKey(produto.getId())
                            ? descontoAplicado
                            : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
                    BigDecimal precoFinalProduto = precoProduto.subtract(descontoProduto)
                            .max(BigDecimal.ZERO)
                            .setScale(2, RoundingMode.HALF_UP);
                    return new ItemCheckoutCalculado(produto, precoFinalProduto);
                })
                .toList();
        BigDecimal precoFinal = itens.stream()
                .map(ItemCheckoutCalculado::precoFinal)
                .reduce(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP), BigDecimal::add);

        return new CheckoutCalculado(
                precoOriginal,
                normalizarDesconto(descontoAplicado),
                precoFinal,
                produtoComDesconto,
                itens
        );
    }

    private Optional<Produto> escolherProdutoParaDesconto(
            List<Produto> produtos,
            RoletaGiro premioRoleta
    ) {
        if (premioRoleta == null || produtos == null || produtos.isEmpty()) {
            return Optional.empty();
        }

        return produtos.stream()
                .filter(produto -> calcularDescontoAplicavel(produto, premioRoleta)
                        .compareTo(BigDecimal.ZERO) > 0)
                .max(Comparator.comparing(produto -> normalizarPreco(produto.getPrecoVenda())));
    }

    private BigDecimal calcularDescontoAplicavel(Produto produto, RoletaGiro premioAtual) {
        if (premioAtual == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal precoOriginal = normalizarPreco(produto.getPrecoVenda());
        BigDecimal desconto = BigDecimal.ZERO;

        if (premioAtual.getTipoPremio() == RoletaTipoPremio.DESCONTO_VALOR) {
            desconto = premioAtual.getValorPremio();
        }
        if (premioAtual.getTipoPremio() == RoletaTipoPremio.DESCONTO_PERCENTUAL) {
            desconto = precoOriginal
                    .multiply(premioAtual.getValorPremio())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }

        if (desconto.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        return desconto.min(precoOriginal).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal normalizarPreco(BigDecimal preco) {
        if (preco == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Produto sem preco valido para pagamento"
            );
        }

        return preco.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal normalizarDesconto(BigDecimal desconto) {
        if (desconto == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        if (desconto.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Desconto invalido para pagamento"
            );
        }

        return desconto.setScale(2, RoundingMode.HALF_UP);
    }

    private Long converterParaCentavos(BigDecimal valor) {
        try {
            return valor.movePointRight(2).longValueExact();
        } catch (ArithmeticException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Preco invalido para pagamento",
                    exception
            );
        }
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

    private record CheckoutCalculado(
            BigDecimal precoOriginal,
            BigDecimal descontoAplicado,
            BigDecimal precoFinal,
            Produto produtoComDesconto,
            List<ItemCheckoutCalculado> itens
    ) {
    }

    private record ItemCheckoutCalculado(
            Produto produto,
            BigDecimal precoFinal
    ) {
    }
}
