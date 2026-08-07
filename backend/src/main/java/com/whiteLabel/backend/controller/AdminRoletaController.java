package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.dto.AdminRoletaRequest;
import com.whiteLabel.backend.dto.AdminRoletaResponse;
import com.whiteLabel.backend.service.RoletaService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/roleta")
public class AdminRoletaController {

    private final RoletaService roletaService;

    public AdminRoletaController(RoletaService roletaService) {
        this.roletaService = roletaService;
    }

    @GetMapping({"", "/"})
    public AdminRoletaResponse status() {
        return roletaService.obterAdmin();
    }

    @PutMapping({"", "/"})
    public AdminRoletaResponse atualizar(@Valid @RequestBody AdminRoletaRequest request) {
        return roletaService.atualizarAdmin(request);
    }
}
