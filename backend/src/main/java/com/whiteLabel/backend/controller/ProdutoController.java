package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.dto.ProdutoResponseDTO;
import com.whiteLabel.backend.service.ProdutoService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/produtos")
public class ProdutoController {

    private final ProdutoService produtoService;

    public ProdutoController(ProdutoService produtoService) {
        this.produtoService = produtoService;
    }

    @GetMapping
    public List<ProdutoResponseDTO> listarProdutosAtivos() {
        return produtoService.listarAtivos();
    }
}
