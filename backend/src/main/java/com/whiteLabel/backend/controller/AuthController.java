package com.whiteLabel.backend.controller;

import com.whiteLabel.backend.dto.RequestOtpRequest;
import com.whiteLabel.backend.dto.TokenResponse;
import com.whiteLabel.backend.dto.VerifyOtpRequest;
import com.whiteLabel.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/request-otp")
    public ResponseEntity<Map<String, String>> requestOtp(
            @Valid @RequestBody RequestOtpRequest request
    ) {
        authService.requestOtp(request);
        return ResponseEntity.ok(Map.of("mensagem", "OTP gerado com validade de 5 minutos"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<TokenResponse> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request
    ) {
        return ResponseEntity.ok(authService.verifyOtp(request));
    }
}
