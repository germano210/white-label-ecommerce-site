package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.dto.PassoResponseDTO;
import com.whiteLabel.backend.service.PassoService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/passos")
public class PassoController {

    private final PassoService passoService;

    public PassoController(PassoService passoService) {
        this.passoService = passoService;
    }

    @PostMapping("/{produtoId}")
    @ResponseStatus(HttpStatus.CREATED)
    public PassoResponseDTO passar(@PathVariable Long produtoId) {
        return passoService.passar(produtoId);
    }
}
