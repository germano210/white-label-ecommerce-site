package com.whiteLabel.backend.service;

import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.dto.AtualizarNomeRequest;
import com.whiteLabel.backend.dto.RequestOtpRequest;
import com.whiteLabel.backend.dto.RequestOtpResponse;
import com.whiteLabel.backend.dto.TokenResponse;
import com.whiteLabel.backend.dto.UsuarioResponse;
import com.whiteLabel.backend.dto.VerifyOtpRequest;
import com.whiteLabel.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    private static final int OTP_VALIDITY_MINUTES = 5;
    private static final int MIN_PHONE_DIGITS = 8;
    private static final int MAX_PHONE_DIGITS = 15;

    private final UsuarioRepository usuarioRepository;
    private final JwtService jwtService;
    private final SecureRandom secureRandom;
    private final Clock clock;

    @Autowired
    public AuthService(UsuarioRepository usuarioRepository, JwtService jwtService) {
        this(usuarioRepository, jwtService, new SecureRandom(), Clock.systemDefaultZone());
    }

    AuthService(
            UsuarioRepository usuarioRepository,
            JwtService jwtService,
            SecureRandom secureRandom,
            Clock clock
    ) {
        this.usuarioRepository = usuarioRepository;
        this.jwtService = jwtService;
        this.secureRandom = secureRandom;
        this.clock = clock;
    }

    @Transactional
    public RequestOtpResponse requestOtp(RequestOtpRequest request) {
        String telefone = normalize(request.telefone());
        var usuarioExistente = usuarioRepository.findByTelefone(telefone);
        boolean existingUser = usuarioExistente.isPresent();
        Usuario usuario = usuarioExistente
                .orElseGet(() -> createNewUser(request.nome(), telefone));

        if (request.nome() != null && !request.nome().isBlank()) {
            usuario.setNome(request.nome().trim());
        }

        String otp = Integer.toString(secureRandom.nextInt(1_000_000) + 1_000_000)
                .substring(1);
        usuario.setOtp(otp);
        usuario.setOtpExpiracao(LocalDateTime.now(clock).plusMinutes(OTP_VALIDITY_MINUTES));
        usuarioRepository.save(usuario);

        System.out.println("OTP do WhatsApp para " + telefone + ": " + otp);

        if (existingUser) {
            return new RequestOtpResponse("EXISTING_USER", "USUARIO_JA_CADASTRADO");
        }

        return new RequestOtpResponse("NEW_USER", "OTP_ENVIADO");
    }

    @Transactional
    public TokenResponse verifyOtp(VerifyOtpRequest request) {
        Usuario usuario = usuarioRepository.findByTelefone(normalize(request.telefone()))
                .orElseThrow(this::invalidOtp);

        LocalDateTime now = LocalDateTime.now(clock);
        if (usuario.getOtp() == null
                || !usuario.getOtp().equals(request.codigo())
                || usuario.getOtpExpiracao() == null
                || !usuario.getOtpExpiracao().isAfter(now)) {
            throw invalidOtp();
        }

        usuario.setOtp(null);
        usuario.setOtpExpiracao(null);
        usuarioRepository.save(usuario);

        String token = jwtService.generateToken(usuario);
        return TokenResponse.from(token, usuario);
    }

    @Transactional
    public UsuarioResponse atualizarNome(AtualizarNomeRequest request) {
        Usuario usuario = usuarioRepository.findById(obterUsuarioAutenticadoId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Usuario autenticado nao encontrado"
                ));

        usuario.setNome(request.nome().trim());
        return UsuarioResponse.from(usuarioRepository.save(usuario));
    }

    private Usuario createNewUser(String nome, String telefone) {
        String nomeNormalizado = nome == null || nome.isBlank() ? null : nome.trim();
        return new Usuario(nomeNormalizado, telefone);
    }

    private String normalize(String telefone) {
        String telefoneNormalizado = telefone
                .trim()
                .replaceAll("[\\s()+-]", "");

        if (!telefoneNormalizado.matches("\\d{" + MIN_PHONE_DIGITS + ","
                + MAX_PHONE_DIGITS + "}")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Telefone deve conter entre 8 e 15 digitos"
            );
        }

        return telefoneNormalizado;
    }

    private ResponseStatusException invalidOtp() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "OTP invalido ou expirado");
    }

    private UUID obterUsuarioAutenticadoId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario nao autenticado");
        }

        try {
            return UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Token de autenticacao invalido",
                    exception
            );
        }
    }
}
