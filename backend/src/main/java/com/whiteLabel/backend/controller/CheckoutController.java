package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.dto.CheckoutResponse;
import com.whiteLabel.backend.service.PedidoService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    private final PedidoService pedidoService;

    public CheckoutController(PedidoService pedidoService) {
        this.pedidoService = pedidoService;
    }

    @PostMapping("/produtos/{produtoId}")
    @ResponseStatus(HttpStatus.CREATED)
    public CheckoutResponse criarCheckoutProduto(@PathVariable Long produtoId) {
        return pedidoService.criarCheckoutProduto(produtoId);
    }
}
