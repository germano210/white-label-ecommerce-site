package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.dto.EnderecoUsuarioRequest;
import com.whiteLabel.backend.dto.UsuarioPerfilResponse;
import com.whiteLabel.backend.dto.UsuarioResgateResponse;
import com.whiteLabel.backend.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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

    @PutMapping("/me/endereco")
    public UsuarioPerfilResponse atualizarEndereco(
            @Valid @RequestBody EnderecoUsuarioRequest request
    ) {
        return usuarioService.atualizarEnderecoAutenticado(request);
    }

    @GetMapping("/me/resgates")
    public List<UsuarioResgateResponse> listarResgates() {
        return usuarioService.listarResgatesAutenticados();
    }
}
