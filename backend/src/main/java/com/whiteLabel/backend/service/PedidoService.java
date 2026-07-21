package com.whiteLabel.backend.service;

import com.whiteLabel.backend.domain.Pagamento;
import com.whiteLabel.backend.domain.Pedido;
import com.whiteLabel.backend.domain.Produto;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.dto.CheckoutResponse;
import com.whiteLabel.backend.dto.CriarCheckoutRequest;
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

import java.util.UUID;

@Service
public class PedidoService {

    private final UsuarioRepository usuarioRepository;
    private final ProdutoRepository produtoRepository;
    private final PedidoRepository pedidoRepository;
    private final PagamentoRepository pagamentoRepository;
    private final String checkoutBaseUrl;

    public PedidoService(
            UsuarioRepository usuarioRepository,
            ProdutoRepository produtoRepository,
            PedidoRepository pedidoRepository,
            PagamentoRepository pagamentoRepository,
            @Value("${payment.checkout-base-url}") String checkoutBaseUrl
    ) {
        this.usuarioRepository = usuarioRepository;
        this.produtoRepository = produtoRepository;
        this.pedidoRepository = pedidoRepository;
        this.pagamentoRepository = pagamentoRepository;
        this.checkoutBaseUrl = checkoutBaseUrl;
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

    private String montarCheckoutUrl(String checkoutId) {
        String baseUrl = checkoutBaseUrl.endsWith("/")
                ? checkoutBaseUrl.substring(0, checkoutBaseUrl.length() - 1)
                : checkoutBaseUrl;

        return baseUrl + "/" + checkoutId;
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
