package com.whiteLabel.backend.service;

import com.whiteLabel.backend.domain.Indicacao;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.dto.IndicacaoAberturaResponse;
import com.whiteLabel.backend.dto.IndicacaoLinkResponse;
import com.whiteLabel.backend.repository.IndicacaoRepository;
import com.whiteLabel.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class IndicacaoService {

    private static final String ALFABETO = "abcdefghijklmnopqrstuvwxyz0123456789";
    private static final int TAMANHO_CODIGO = 16;
    private static final int MAX_TENTATIVAS_GERACAO = 20;

    private final UsuarioRepository usuarioRepository;
    private final IndicacaoRepository indicacaoRepository;
    private final SecureRandom secureRandom;
    private final Clock clock;
    private final String frontendBaseUrl;

    @Autowired
    public IndicacaoService(
            UsuarioRepository usuarioRepository,
            IndicacaoRepository indicacaoRepository,
            @Value("${app.frontend.public-base-url:https://brechodacami.com}") String frontendBaseUrl
    ) {
        this(
                usuarioRepository,
                indicacaoRepository,
                new SecureRandom(),
                Clock.systemDefaultZone(),
                frontendBaseUrl
        );
    }

    IndicacaoService(
            UsuarioRepository usuarioRepository,
            IndicacaoRepository indicacaoRepository,
            SecureRandom secureRandom,
            Clock clock,
            String frontendBaseUrl
    ) {
        this.usuarioRepository = usuarioRepository;
        this.indicacaoRepository = indicacaoRepository;
        this.secureRandom = secureRandom;
        this.clock = clock;
        this.frontendBaseUrl = normalizarBaseUrl(frontendBaseUrl);
    }

    @Transactional
    public IndicacaoLinkResponse obterMeuLink() {
        Usuario usuario = usuarioRepository.findById(obterUsuarioAutenticadoId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Usuario autenticado nao encontrado"
                ));

        if (usuario.getCodigoIndicacao() == null || usuario.getCodigoIndicacao().isBlank()) {
            usuario.setCodigoIndicacao(gerarCodigoUnico());
            usuario = usuarioRepository.save(usuario);
        }

        return montarLink(usuario.getCodigoIndicacao());
    }

    @Transactional
    public IndicacaoAberturaResponse registrarAbertura(String codigo) {
        String codigoNormalizado = normalizarCodigo(codigo);
        Usuario indicador = usuarioRepository.findByCodigoIndicacao(codigoNormalizado)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Codigo de indicacao nao encontrado"
                ));

        Indicacao indicacao = indicacaoRepository.save(Indicacao.aberta(
                codigoNormalizado,
                indicador,
                LocalDateTime.now(clock)
        ));

        return new IndicacaoAberturaResponse(
                indicacao.getCodigo(),
                indicacao.getStatus().name(),
                indicacao.getAbertoEm()
        );
    }

    @Transactional
    public void registrarConversao(Usuario usuarioIndicado, String codigoIndicacao) {
        if (usuarioIndicado == null || codigoIndicacao == null || codigoIndicacao.isBlank()) {
            return;
        }

        if (usuarioIndicado.getIndicadoPor() != null
                || (usuarioIndicado.getId() != null
                && indicacaoRepository.existsByUsuarioIndicadoId(usuarioIndicado.getId()))) {
            return;
        }

        String codigoNormalizado = normalizarCodigo(codigoIndicacao);
        usuarioRepository.findByCodigoIndicacao(codigoNormalizado)
                .filter(indicador -> !mesmoUsuario(indicador, usuarioIndicado))
                .ifPresent(indicador -> {
                    usuarioIndicado.setIndicadoPor(indicador);
                    Usuario usuarioVinculado = usuarioRepository.save(usuarioIndicado);
                    indicacaoRepository.save(Indicacao.convertida(
                            codigoNormalizado,
                            indicador,
                            usuarioVinculado,
                            LocalDateTime.now(clock)
                    ));
                });
    }

    private IndicacaoLinkResponse montarLink(String codigo) {
        String url = UriComponentsBuilder.fromUriString(frontendBaseUrl)
                .path("/foryou")
                .queryParam("ref", codigo)
                .toUriString();

        return new IndicacaoLinkResponse(codigo, url);
    }

    private String gerarCodigoUnico() {
        for (int tentativa = 0; tentativa < MAX_TENTATIVAS_GERACAO; tentativa++) {
            String codigo = gerarCodigo();
            if (!usuarioRepository.existsByCodigoIndicacao(codigo)) {
                return codigo;
            }
        }

        throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Nao foi possivel gerar codigo de indicacao"
        );
    }

    private String gerarCodigo() {
        StringBuilder codigo = new StringBuilder(TAMANHO_CODIGO);
        for (int indice = 0; indice < TAMANHO_CODIGO; indice++) {
            codigo.append(ALFABETO.charAt(secureRandom.nextInt(ALFABETO.length())));
        }
        return codigo.toString();
    }

    private boolean mesmoUsuario(Usuario indicador, Usuario indicado) {
        if (indicador.getId() != null && indicador.getId().equals(indicado.getId())) {
            return true;
        }

        return indicador.getTelefone() != null
                && indicador.getTelefone().equals(indicado.getTelefone());
    }

    private String normalizarCodigo(String codigo) {
        if (codigo == null || codigo.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Codigo de indicacao e obrigatorio"
            );
        }

        return codigo.trim().toLowerCase();
    }

    private String normalizarBaseUrl(String baseUrl) {
        String url = baseUrl == null || baseUrl.isBlank()
                ? "https://brechodacami.com"
                : baseUrl.trim();

        while (url.endsWith("/")) {
            url = url.substring(0, url.length() - 1);
        }

        return url;
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
