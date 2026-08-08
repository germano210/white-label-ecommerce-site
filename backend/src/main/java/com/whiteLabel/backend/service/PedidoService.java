package com.whiteLabel.backend.service;

import com.whiteLabel.backend.domain.Pagamento;
import com.whiteLabel.backend.domain.Pedido;
import com.whiteLabel.backend.domain.Produto;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.dto.CheckoutResponse;
import com.whiteLabel.backend.dto.CriarCheckoutRequest;
import com.whiteLabel.backend.dto.InfinitePayLinkRequest;
import com.whiteLabel.backend.dto.InfinitePayLinkResponse;
import com.whiteLabel.backend.repository.PagamentoRepository;
import com.whiteLabel.backend.repository.PedidoRepository;
import com.whiteLabel.backend.repository.ProdutoRepository;
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
import java.util.List;
import java.util.UUID;

@Service
public class PedidoService {

    private static final String PROVIDER_INFINITEPAY = "INFINITEPAY";

    private final UsuarioRepository usuarioRepository;
    private final ProdutoRepository produtoRepository;
    private final PedidoRepository pedidoRepository;
    private final PagamentoRepository pagamentoRepository;
    private final InfinitePayClient infinitePayClient;
    private final String checkoutBaseUrl;
    private final String infinitePayHandle;
    private final String infinitePayRedirectUrl;
    private final String infinitePayWebhookUrl;

    public PedidoService(
            UsuarioRepository usuarioRepository,
            ProdutoRepository produtoRepository,
            PedidoRepository pedidoRepository,
            PagamentoRepository pagamentoRepository,
            InfinitePayClient infinitePayClient,
            @Value("${payment.checkout-base-url}") String checkoutBaseUrl,
            @Value("${infinitepay.handle}") String infinitePayHandle,
            @Value("${infinitepay.redirect-url}") String infinitePayRedirectUrl,
            @Value("${infinitepay.webhook-url}") String infinitePayWebhookUrl
    ) {
        this.usuarioRepository = usuarioRepository;
        this.produtoRepository = produtoRepository;
        this.pedidoRepository = pedidoRepository;
        this.pagamentoRepository = pagamentoRepository;
        this.infinitePayClient = infinitePayClient;
        this.checkoutBaseUrl = checkoutBaseUrl;
        this.infinitePayHandle = infinitePayHandle;
        this.infinitePayRedirectUrl = infinitePayRedirectUrl;
        this.infinitePayWebhookUrl = infinitePayWebhookUrl;
    }

    @Transactional
    public CheckoutResponse criarCheckout(CriarCheckoutRequest request) {
        Usuario usuario = buscarUsuarioAutenticado();
        Pedido pedido = new Pedido(usuario);

        request.itens().forEach(item -> {
            Produto produto = produtoRepository.findById(item.produtoId())
                    .filter(produtoEncontrado -> Boolean.TRUE.equals(produtoEncontrado.getAtivo()))
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Produto nao encontrado"
                    ));
            pedido.adicionarItem(produto, item.quantidade());
        });

        pedido.aguardarPagamento();
        Pedido pedidoSalvo = pedidoRepository.save(pedido);
        Pagamento pagamento = pagamentoRepository.save(new Pagamento(
                pedidoSalvo,
                UUID.randomUUID().toString()
        ));

        return CheckoutResponse.from(pagamento, montarCheckoutUrl(pagamento.getCheckoutId()));
    }

    @Transactional
    public CheckoutResponse criarCheckoutProduto(Long produtoId) {
        Usuario usuario = buscarUsuarioAutenticado();
        Produto produto = produtoRepository.findById(produtoId)
                .filter(produtoEncontrado -> Boolean.TRUE.equals(produtoEncontrado.getAtivo()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Produto nao encontrado"
                ));

        BigDecimal precoOriginal = normalizarPreco(produto.getPrecoVenda());
        BigDecimal descontoAplicado = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        BigDecimal precoFinal = precoOriginal.subtract(descontoAplicado)
                .setScale(2, RoundingMode.HALF_UP);

        if (precoFinal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Produto sem preco valido para pagamento"
            );
        }

        Pedido pedido = new Pedido(usuario);
        pedido.adicionarItem(produto, 1);
        pedido.registrarCheckoutProduto(
                produto,
                precoOriginal,
                descontoAplicado,
                precoFinal
        );
        pedido.aguardarPagamento();

        Pedido pedidoSalvo = pedidoRepository.saveAndFlush(pedido);
        pedidoSalvo.definirOrderNsu(pedidoSalvo.getId().toString());
        pedidoSalvo = pedidoRepository.saveAndFlush(pedidoSalvo);

        Pagamento pagamento = pagamentoRepository.save(new Pagamento(
                pedidoSalvo,
                pedidoSalvo.getOrderNsu(),
                PROVIDER_INFINITEPAY
        ));

        InfinitePayLinkResponse link = infinitePayClient.criarLink(
                montarInfinitePayRequest(pedidoSalvo, produto, precoFinal)
        );

        if (link == null || link.url() == null || link.url().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "InfinitePay nao retornou URL de checkout"
            );
        }

        return CheckoutResponse.from(pagamento, link.url());
    }

    private String montarCheckoutUrl(String checkoutId) {
        String baseUrl = checkoutBaseUrl.endsWith("/")
                ? checkoutBaseUrl.substring(0, checkoutBaseUrl.length() - 1)
                : checkoutBaseUrl;

        return baseUrl + "/" + checkoutId;
    }

    private InfinitePayLinkRequest montarInfinitePayRequest(
            Pedido pedido,
            Produto produto,
            BigDecimal precoFinal
    ) {
        return new InfinitePayLinkRequest(
                infinitePayHandle,
                infinitePayRedirectUrl,
                infinitePayWebhookUrl,
                pedido.getOrderNsu(),
                List.of(new InfinitePayLinkRequest.Item(
                        1,
                        converterParaCentavos(precoFinal),
                        produto.getNome()
                ))
        );
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
}
