package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.dto.UsuarioPerfilResponse;
import com.whiteLabel.backend.service.UsuarioService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping("/me")
    public UsuarioPerfilResponse perfilAutenticado() {
        return usuarioService.buscarPerfilAutenticado();
    }
}
