package com.whiteLabel.backend.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/**
 * Configura a seguranca stateless da API e separa rotas administrativas por autoridade
 * para que somente JWTs com ADMIN possam operar dados sensiveis do painel.
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final List<String> allowedOrigins;
    private final boolean requireHttps;

    public SecurityConfig(
            @Value("${app.cors.allowed-origins}") String allowedOrigins,
            @Value("${app.security.require-https:false}") boolean requireHttps
    ) {
        this.allowedOrigins = parseAllowedOrigins(allowedOrigins);
        this.requireHttps = requireHttps;
    }

    /**
     * Protege o namespace administrativo antes das demais regras para impedir que rotas
     * de gestao sejam acessadas por tokens comuns emitidos pelo fluxo OTP do cliente.
     */
    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter
    ) throws Exception {
        return http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .requiresChannel(channel -> {
                    if (requireHttps) {
                        channel.anyRequest().requiresSecure();
                    }
                })
                .headers(headers -> headers
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .preload(true)
                                .maxAgeInSeconds(31536000))
                        .contentTypeOptions(Customizer.withDefaults())
                        .frameOptions(frame -> frame.deny())
                        .referrerPolicy(referrer -> referrer.policy(
                                ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
                        .contentSecurityPolicy(csp -> csp.policyDirectives(
                                "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"))
                        .cacheControl(Customizer.withDefaults()))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, exception) ->
                                response.sendError(HttpServletResponse.SC_UNAUTHORIZED)))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/admin/missoes", "/api/admin/missoes/**")
                        .hasAnyAuthority("ROLE_ADMIN", "ADMIN")
                        .requestMatchers("/api/admin/**")
                        .hasAnyAuthority("ROLE_ADMIN", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/missoes", "/api/missoes/")
                        .permitAll()
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/produtos",
                                "/api/produtos/"
                        ).permitAll()
                        .requestMatchers(
                                HttpMethod.POST,
                        "/api/auth/request-otp",
                        "/api/auth/verify-otp",
                        "/api/auth/admin/login"
                        ).permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/pagamentos/webhook").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html"
                        ).permitAll()
                        .requestMatchers("/api/auth/atualizar-nome").authenticated()
                        .requestMatchers(
                                "/api/missoes/semanais",
                                "/api/missoes/semanais/**"
                        ).authenticated()
                        .requestMatchers("/api/pedidos/**").authenticated()
                        .requestMatchers("/api/curtidas/**").authenticated()
                        .requestMatchers("/api/passos/**").authenticated()
                        .requestMatchers("/api/compartilhamentos/**").authenticated()
                        .anyRequest().authenticated())
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    /**
     * Libera explicitamente o cabecalho Authorization no CORS para que o navegador
     * envie e exponha o token JWT nas chamadas do frontend Vite para a API Spring.
     */
    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private List<String> parseAllowedOrigins(String rawOrigins) {
        List<String> origins = Arrays.stream(rawOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .distinct()
                .toList();

        if (origins.isEmpty()) {
            throw new IllegalStateException("app.cors.allowed-origins deve conter ao menos uma origem");
        }

        if (origins.stream().anyMatch(origin -> "*".equals(origin)
                || origin.toLowerCase(Locale.ROOT).contains("://*"))) {
            throw new IllegalStateException("CORS nao permite wildcard em producao");
        }

        return origins;
    }
}
