package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.dto.LojaConfiguracaoPublicaResponse;
import com.whiteLabel.backend.service.LojaConfiguracaoService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/configuracoes")
public class ConfiguracaoController {

    private final LojaConfiguracaoService lojaConfiguracaoService;

    public ConfiguracaoController(LojaConfiguracaoService lojaConfiguracaoService) {
        this.lojaConfiguracaoService = lojaConfiguracaoService;
    }

    @GetMapping({"/publicas", "/publicas/"})
    public LojaConfiguracaoPublicaResponse publicas() {
        return lojaConfiguracaoService.obterPublica();
    }
}
