package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.dto.CompartilhamentoAberturaResponse;
import com.whiteLabel.backend.dto.CompartilhamentoItemResponse;
import com.whiteLabel.backend.service.CompartilhamentoService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/compartilhamentos")
public class CompartilhamentoController {

    private final CompartilhamentoService compartilhamentoService;

    public CompartilhamentoController(CompartilhamentoService compartilhamentoService) {
        this.compartilhamentoService = compartilhamentoService;
    }

    @PostMapping("/produtos/{produtoId}")
    @ResponseStatus(HttpStatus.CREATED)
    public CompartilhamentoItemResponse gerarLinkProduto(@PathVariable Long produtoId) {
        return compartilhamentoService.gerarLinkProduto(produtoId);
    }

    @PostMapping("/{codigo}/abrir")
    public CompartilhamentoAberturaResponse abrirLink(@PathVariable String codigo) {
        return compartilhamentoService.abrirLink(codigo);
    }
}
