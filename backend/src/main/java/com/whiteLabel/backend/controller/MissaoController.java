package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.dto.MissaoResponse;
import com.whiteLabel.backend.dto.MissoesSemanaisResponse;
import com.whiteLabel.backend.dto.ResgateTentativasResponse;
import com.whiteLabel.backend.service.MissaoService;
import com.whiteLabel.backend.service.MissaoSemanalService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/missoes")
public class MissaoController {

    private final MissaoService missaoService;
    private final MissaoSemanalService missaoSemanalService;

    public MissaoController(
            MissaoService missaoService,
            MissaoSemanalService missaoSemanalService
    ) {
        this.missaoService = missaoService;
        this.missaoSemanalService = missaoSemanalService;
    }

    @GetMapping({"", "/"})
    public List<MissaoResponse> listar() {
        return missaoService.listar();
    }

    @GetMapping("/semanais")
    public MissoesSemanaisResponse listarSemanais() {
        return missaoSemanalService.listar();
    }

    @PostMapping("/semanais/resgatar-tentativas")
    public ResgateTentativasResponse resgatarTentativasSemanais() {
        return missaoSemanalService.resgatarTentativas();
    }
}
