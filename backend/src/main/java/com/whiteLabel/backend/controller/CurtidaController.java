package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.dto.CurtidaResponseDTO;
import com.whiteLabel.backend.dto.ProdutoResponseDTO;
import com.whiteLabel.backend.service.CurtidaService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/curtidas")
public class CurtidaController {

    private final CurtidaService curtidaService;

    public CurtidaController(CurtidaService curtidaService) {
        this.curtidaService = curtidaService;
    }

    @GetMapping
    public List<ProdutoResponseDTO> listarCurtidas() {
        return curtidaService.listarCurtidas();
    }

    @PostMapping("/{produtoId}")
    @ResponseStatus(HttpStatus.CREATED)
    public CurtidaResponseDTO curtir(@PathVariable Long produtoId) {
        return curtidaService.curtir(produtoId);
    }
}
