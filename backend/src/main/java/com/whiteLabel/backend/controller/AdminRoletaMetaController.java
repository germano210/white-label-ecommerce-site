package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.dto.RoletaMetaRequest;
import com.whiteLabel.backend.dto.RoletaMetaResponse;
import com.whiteLabel.backend.service.RoletaMetaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/roleta/metas")
public class AdminRoletaMetaController {

    private final RoletaMetaService roletaMetaService;

    public AdminRoletaMetaController(RoletaMetaService roletaMetaService) {
        this.roletaMetaService = roletaMetaService;
    }

    @GetMapping({"", "/"})
    public List<RoletaMetaResponse> listar() {
        return roletaMetaService.listarAdmin();
    }

    @PostMapping({"", "/"})
    @ResponseStatus(HttpStatus.CREATED)
    public RoletaMetaResponse criar(@Valid @RequestBody RoletaMetaRequest request) {
        return roletaMetaService.criar(request);
    }

    @PutMapping("/{id}")
    public RoletaMetaResponse atualizar(
            @PathVariable Long id,
            @Valid @RequestBody RoletaMetaRequest request
    ) {
        return roletaMetaService.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public RoletaMetaResponse desativar(@PathVariable Long id) {
        return roletaMetaService.desativar(id);
    }

    @PostMapping("/{id}/reiniciar")
    public RoletaMetaResponse reiniciar(@PathVariable Long id) {
        return roletaMetaService.reiniciar(id);
    }
}
