package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.dto.CheckoutResponse;
import com.whiteLabel.backend.dto.CheckoutProdutosRequest;
import com.whiteLabel.backend.dto.CheckoutReservaRequest;
import com.whiteLabel.backend.dto.CheckoutReservaResponse;
import com.whiteLabel.backend.dto.CheckoutStatusResponse;
import com.whiteLabel.backend.service.PedidoService;
import com.whiteLabel.backend.service.ProdutoReservaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    private final PedidoService pedidoService;
    private final ProdutoReservaService produtoReservaService;

    public CheckoutController(
            PedidoService pedidoService,
            ProdutoReservaService produtoReservaService
    ) {
        this.pedidoService = pedidoService;
        this.produtoReservaService = produtoReservaService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CheckoutResponse criarCheckout(@Valid @RequestBody CheckoutProdutosRequest request) {
        return pedidoService.criarCheckoutProdutos(request);
    }

    @PostMapping("/reservas")
    @ResponseStatus(HttpStatus.CREATED)
    public CheckoutReservaResponse reservarProdutos(@Valid @RequestBody CheckoutReservaRequest request) {
        return produtoReservaService.reservar(request);
    }

    @PostMapping("/produtos/{produtoId}")
    @ResponseStatus(HttpStatus.CREATED)
    public CheckoutResponse criarCheckoutProduto(@PathVariable Long produtoId) {
        return pedidoService.criarCheckoutProduto(produtoId);
    }

    @GetMapping("/{pedidoId}/status")
    public CheckoutStatusResponse consultarStatus(@PathVariable Long pedidoId) {
        return pedidoService.consultarStatusCheckout(pedidoId);
    }
}
