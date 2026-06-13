package com.whiteLabel.backend.service;

import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.dto.RequestOtpRequest;
import com.whiteLabel.backend.dto.TokenResponse;
import com.whiteLabel.backend.dto.VerifyOtpRequest;
import com.whiteLabel.backend.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    private static final Clock CLOCK =
            Clock.fixed(Instant.parse("2026-06-12T12:00:00Z"), ZoneOffset.UTC);

    private UsuarioRepository repository;
    private JwtService jwtService;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        repository = mock(UsuarioRepository.class);
        jwtService = mock(JwtService.class);
        SecureRandom random = mock(SecureRandom.class);
        when(random.nextInt(1_000_000)).thenReturn(42);
        authService = new AuthService(repository, jwtService, random, CLOCK);
    }

    @Test
    void shouldCreateUserAndGenerateOtp() {
        when(repository.findByTelefone("5511999999999")).thenReturn(Optional.empty());

        authService.requestOtp(new RequestOtpRequest("5511999999999", "Maria"));

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(repository).save(captor.capture());
        assertEquals("000042", captor.getValue().getOtp());
        assertEquals(
                LocalDateTime.now(CLOCK).plusMinutes(5),
                captor.getValue().getOtpExpiracao()
        );
    }

    @Test
    void shouldAllowNewUserWithoutName() {
        when(repository.findByTelefone("5511999999999")).thenReturn(Optional.empty());

        authService.requestOtp(new RequestOtpRequest("5511999999999", null));

        verify(repository).save(any(Usuario.class));
    }

    @Test
    void shouldNormalizeFormattedPhone() {
        when(repository.findByTelefone("5511999999999")).thenReturn(Optional.empty());

        authService.requestOtp(new RequestOtpRequest("+55 (11) 99999-9999", "Maria"));

        verify(repository).findByTelefone("5511999999999");
    }

    @Test
    void shouldReuseExistingUserForSamePhone() {
        Usuario usuario = new Usuario("Maria", "5511999999999");
        when(repository.findByTelefone("5511999999999")).thenReturn(Optional.of(usuario));

        authService.requestOtp(new RequestOtpRequest("5511999999999", "Maria Atualizada"));

        verify(repository).save(usuario);
        assertEquals("Maria Atualizada", usuario.getNome());
        assertEquals("5511999999999", usuario.getTelefone());
    }

    @Test
    void shouldRejectInvalidPhone() {
        assertThrows(
                ResponseStatusException.class,
                () -> authService.requestOtp(new RequestOtpRequest("telefone", "Maria"))
        );
    }

    @Test
    void shouldConsumeValidOtpAndReturnToken() {
        Usuario usuario = userWithOtp("123456", LocalDateTime.now(CLOCK).plusMinutes(1));
        when(repository.findByTelefone("5511999999999")).thenReturn(Optional.of(usuario));
        when(jwtService.generateToken(usuario)).thenReturn("jwt-token");

        TokenResponse response = authService.verifyOtp(
                new VerifyOtpRequest("5511999999999", "123456")
        );

        assertEquals("jwt-token", response.token());
        assertEquals("Bearer", response.tipo());
        assertEquals("Maria", response.usuario().nome());
        assertEquals("5511999999999", response.usuario().telefone());
        assertNull(usuario.getOtp());
        assertNull(usuario.getOtpExpiracao());
        verify(repository).save(usuario);
    }

    @Test
    void shouldRejectExpiredOtp() {
        Usuario usuario = userWithOtp("123456", LocalDateTime.now(CLOCK));
        when(repository.findByTelefone("5511999999999")).thenReturn(Optional.of(usuario));

        assertThrows(
                ResponseStatusException.class,
                () -> authService.verifyOtp(
                        new VerifyOtpRequest("5511999999999", "123456"))
        );
    }

    @Test
    void shouldRejectIncorrectOtp() {
        Usuario usuario = userWithOtp("123456", LocalDateTime.now(CLOCK).plusMinutes(1));
        when(repository.findByTelefone("5511999999999")).thenReturn(Optional.of(usuario));

        assertThrows(
                ResponseStatusException.class,
                () -> authService.verifyOtp(
                        new VerifyOtpRequest("5511999999999", "654321"))
        );
    }

    private Usuario userWithOtp(String otp, LocalDateTime expiry) {
        Usuario usuario = new Usuario("Maria", "5511999999999");
        usuario.setOtp(otp);
        usuario.setOtpExpiracao(expiry);
        return usuario;
    }
}
