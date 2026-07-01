package com.whiteLabel.backend.service;

import com.whiteLabel.backend.domain.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.UUID;

/**
 * Mantem a geracao de JWT do fluxo OTP e extrai autoridades administrativas
 * quando o token recebido pelo painel declarar role ou permissao ADMIN.
 */
@Service
public class JwtService {

    private final SecretKey secretKey;
    private final Duration expiration;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration-minutes}") long expirationMinutes
    ) {
        this.secretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        this.expiration = Duration.ofMinutes(expirationMinutes);
    }

    /**
     * Emite o JWT do fluxo OTP incluindo o perfil de acesso usado pelas rotas admin.
     */
    public String generateToken(Usuario usuario) {
        Instant now = Instant.now();

        return Jwts.builder()
                .subject(usuario.getId().toString())
                .claim("telefone", usuario.getTelefone())
                .claim("nome", usuario.getNome())
                .claim("roles", List.of(usuario.getRole().name()))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(expiration)))
                .signWith(secretKey)
                .compact();
    }

    /**
     * Reconstrui o principal autenticado com authorities para que o Spring Security
     * bloqueie rotas de admin para tokens comuns sem permissao administrativa.
     */
    public JwtPrincipal extractPrincipal(String token) {
        Claims claims = extractClaims(token);

        return new JwtPrincipal(
                UUID.fromString(claims.getSubject()),
                extractAuthorities(claims)
        );
    }

    public UUID extractUserId(String token) {
        Claims claims = extractClaims(token);

        return UUID.fromString(claims.getSubject());
    }

    private Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private List<String> extractAuthorities(Claims claims) {
        List<String> authorities = new ArrayList<>();
        addClaimAuthorities(authorities, claims.get("role"));
        addClaimAuthorities(authorities, claims.get("roles"));
        addClaimAuthorities(authorities, claims.get("permission"));
        addClaimAuthorities(authorities, claims.get("permissions"));

        return authorities.stream()
                .distinct()
                .toList();
    }

    private void addClaimAuthorities(List<String> authorities, Object claim) {
        if (claim instanceof String authority) {
            addAuthority(authorities, authority);
            return;
        }

        if (claim instanceof Collection<?> collection) {
            collection.forEach(value -> {
                if (value instanceof String authority) {
                    addAuthority(authorities, authority);
                }
            });
        }
    }

    private void addAuthority(List<String> authorities, String value) {
        String authority = value.trim();

        if (authority.isBlank()) {
            return;
        }

        authorities.add(authority);

        if (!authority.startsWith("ROLE_")) {
            authorities.add("ROLE_" + authority);
        }
    }

    public record JwtPrincipal(UUID userId, List<String> authorities) {
    }
}
