package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.dto.MissaoResponse;
import com.whiteLabel.backend.service.MissaoService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/missoes")
public class MissaoController {

    private final MissaoService missaoService;

    public MissaoController(MissaoService missaoService) {
        this.missaoService = missaoService;
    }

    @GetMapping({"", "/"})
    public List<MissaoResponse> listar() {
        return missaoService.listar();
    }
}
