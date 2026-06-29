package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.dto.AtualizarNomeRequest;
import com.whiteLabel.backend.dto.RequestOtpRequest;
import com.whiteLabel.backend.dto.RequestOtpResponse;
import com.whiteLabel.backend.dto.TokenResponse;
import com.whiteLabel.backend.dto.UsuarioResponse;
import com.whiteLabel.backend.dto.VerifyOtpRequest;
import com.whiteLabel.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/auth/request-otp")
    public ResponseEntity<RequestOtpResponse> requestOtp(
            @Valid @RequestBody RequestOtpRequest request
    ) {
        return ResponseEntity.ok(authService.requestOtp(request));
    }

    @PostMapping("/auth/verify-otp")
    public ResponseEntity<TokenResponse> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request
    ) {
        return ResponseEntity.ok(authService.verifyOtp(request));
    }

    @PutMapping("/api/auth/atualizar-nome")
    public ResponseEntity<UsuarioResponse> atualizarNome(
            @Valid @RequestBody AtualizarNomeRequest request
    ) {
        return ResponseEntity.ok(authService.atualizarNome(request));
    }
}
