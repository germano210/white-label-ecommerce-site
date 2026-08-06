package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.dto.IndicacaoAberturaResponse;
import com.whiteLabel.backend.dto.IndicacaoLinkResponse;
import com.whiteLabel.backend.service.IndicacaoService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/indicacoes")
public class IndicacaoController {

    private final IndicacaoService indicacaoService;

    public IndicacaoController(IndicacaoService indicacaoService) {
        this.indicacaoService = indicacaoService;
    }

    @GetMapping("/meu-link")
    public IndicacaoLinkResponse meuLink() {
        return indicacaoService.obterMeuLink();
    }

    @PostMapping("/meu-link")
    public IndicacaoLinkResponse criarMeuLink() {
        return indicacaoService.obterMeuLink();
    }

    @PostMapping("/{codigo}/abrir")
    public IndicacaoAberturaResponse abrir(@PathVariable String codigo) {
        return indicacaoService.registrarAbertura(codigo);
    }
}
