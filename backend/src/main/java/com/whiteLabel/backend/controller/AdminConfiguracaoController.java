package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.dto.LojaConfiguracaoAdminResponse;
import com.whiteLabel.backend.dto.LojaConfiguracaoRequest;
import com.whiteLabel.backend.service.LojaConfiguracaoService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/configuracoes")
public class AdminConfiguracaoController {

    private final LojaConfiguracaoService lojaConfiguracaoService;

    public AdminConfiguracaoController(LojaConfiguracaoService lojaConfiguracaoService) {
        this.lojaConfiguracaoService = lojaConfiguracaoService;
    }

    @GetMapping
    public LojaConfiguracaoAdminResponse obter() {
        return lojaConfiguracaoService.obterAdmin();
    }

    @PutMapping
    public LojaConfiguracaoAdminResponse atualizar(
            @Valid @RequestBody LojaConfiguracaoRequest request
    ) {
        return lojaConfiguracaoService.atualizar(request);
    }
}
