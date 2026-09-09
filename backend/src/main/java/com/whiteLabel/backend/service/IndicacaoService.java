package com.whiteLabel.backend.service;

import com.whiteLabel.backend.domain.Indicacao;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.dto.IndicacaoAberturaResponse;
import com.whiteLabel.backend.dto.IndicacaoLinkResponse;
import com.whiteLabel.backend.repository.IndicacaoRepository;
import com.whiteLabel.backend.repository.RoletaParticipanteRepository;
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
import java.util.Optional;
import java.util.UUID;

@Service
public class IndicacaoService {

    private static final String ALFABETO = "abcdefghijklmnopqrstuvwxyz0123456789";
    private static final int TAMANHO_CODIGO = 16;
    private static final int MAX_TENTATIVAS_GERACAO = 20;

    private final UsuarioRepository usuarioRepository;
    private final IndicacaoRepository indicacaoRepository;
    private final RoletaParticipanteRepository roletaParticipanteRepository;
    private final RoletaIndicacaoRecompensaService roletaIndicacaoRecompensaService;
    private final SecureRandom secureRandom;
    private final Clock clock;
    private final String frontendBaseUrl;

    @Autowired
    public IndicacaoService(
            UsuarioRepository usuarioRepository,
            IndicacaoRepository indicacaoRepository,
            RoletaParticipanteRepository roletaParticipanteRepository,
            RoletaIndicacaoRecompensaService roletaIndicacaoRecompensaService,
            @Value("${app.frontend.public-base-url:https://brechodacami.com}") String frontendBaseUrl
    ) {
        this(
                usuarioRepository,
                indicacaoRepository,
                roletaParticipanteRepository,
                roletaIndicacaoRecompensaService,
                new SecureRandom(),
                Clock.systemDefaultZone(),
                frontendBaseUrl
        );
    }

    IndicacaoService(
            UsuarioRepository usuarioRepository,
            IndicacaoRepository indicacaoRepository,
            RoletaParticipanteRepository roletaParticipanteRepository,
            RoletaIndicacaoRecompensaService roletaIndicacaoRecompensaService,
            SecureRandom secureRandom,
            Clock clock,
            String frontendBaseUrl
    ) {
        this.usuarioRepository = usuarioRepository;
        this.indicacaoRepository = indicacaoRepository;
        this.roletaParticipanteRepository = roletaParticipanteRepository;
        this.roletaIndicacaoRecompensaService = roletaIndicacaoRecompensaService;
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

        String codigo = garantirCodigoIndicacao(usuario);

        return montarLink(codigo);
    }

    @Transactional
    public IndicacaoLinkResponse obterLink(Usuario usuario) {
        return montarLink(garantirCodigoIndicacao(usuario));
    }

    @Transactional
    public String garantirCodigoIndicacao(Usuario usuario) {
        if (usuario == null || usuario.getId() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario autenticado nao encontrado");
        }

        Usuario usuarioAtual = usuarioRepository.findByIdForUpdate(usuario.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Usuario autenticado nao encontrado"
                ));

        if (usuarioAtual.getCodigoIndicacao() == null || usuarioAtual.getCodigoIndicacao().isBlank()) {
            usuarioAtual.setCodigoIndicacao(obterCodigoLegadoRoleta(usuarioAtual)
                    .orElseGet(this::gerarCodigoUnico));
            usuarioAtual = usuarioRepository.save(usuarioAtual);
        }

        return usuarioAtual.getCodigoIndicacao();
    }

    @Transactional
    public IndicacaoAberturaResponse registrarAbertura(String codigo) {
        String codigoNormalizado = normalizarCodigo(codigo);
        Usuario indicador = buscarIndicadorPorCodigo(codigoNormalizado)
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
    public Optional<IndicacaoConversao> registrarConversao(Usuario usuarioIndicado, String codigoIndicacao) {
        return registrarConversao(usuarioIndicado, codigoIndicacao, false);
    }

    @Transactional
    public Optional<IndicacaoConversao> registrarConversaoObrigatoria(
            Usuario usuarioIndicado,
            String codigoIndicacao
    ) {
        return registrarConversao(usuarioIndicado, codigoIndicacao, true);
    }

    private Optional<IndicacaoConversao> registrarConversao(
            Usuario usuarioIndicado,
            String codigoIndicacao,
            boolean exigirCodigoValido
    ) {
        if (usuarioIndicado == null || codigoIndicacao == null || codigoIndicacao.isBlank()) {
            if (exigirCodigoValido) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Codigo de indicacao e obrigatorio"
                );
            }
            return Optional.empty();
        }

        String codigoNormalizado = normalizarCodigo(codigoIndicacao);
        Optional<Usuario> indicadorOptional = buscarIndicadorPorCodigo(codigoNormalizado);
        if (indicadorOptional.isEmpty()) {
            if (exigirCodigoValido) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Codigo de indicacao nao encontrado"
                );
            }
            return Optional.empty();
        }

        Usuario indicador = indicadorOptional.get();
        Usuario indicado = buscarUsuarioIndicadoAtualizado(usuarioIndicado);
        if (mesmoUsuario(indicador, indicado)) {
            if (exigirCodigoValido) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Usuario nao pode usar o proprio convite"
                );
            }
            return Optional.empty();
        }

        if (indicado.getIndicadoPor() != null) {
            if (!mesmoUsuario(indicado.getIndicadoPor(), indicador)) {
                return Optional.empty();
            }

            return processarRecompensa(new IndicacaoConversao(
                    indicado.getIndicadoPor(),
                    indicado,
                    codigoNormalizado,
                    false
            ));
        }

        Optional<Indicacao> indicacaoExistente = indicacaoRepository
                .findByUsuarioIndicadoIdFetchIndicador(indicado.getId())
                .stream()
                .findFirst();
        if (indicacaoExistente.isPresent()) {
            Usuario indicadorExistente = indicacaoExistente.get().getUsuarioIndicador();
            indicado.setIndicadoPor(indicadorExistente);
            Usuario usuarioVinculado = usuarioRepository.save(indicado);
            return processarRecompensa(new IndicacaoConversao(
                    indicadorExistente,
                    usuarioVinculado,
                    indicacaoExistente.get().getCodigo(),
                    false
            ));
        }

        indicado.setIndicadoPor(indicador);
        Usuario usuarioVinculado = usuarioRepository.save(indicado);
        indicacaoRepository.save(Indicacao.convertida(
                codigoNormalizado,
                indicador,
                usuarioVinculado,
                LocalDateTime.now(clock)
        ));

        return processarRecompensa(new IndicacaoConversao(
                indicador,
                usuarioVinculado,
                codigoNormalizado,
                true
        ));
    }

    private IndicacaoLinkResponse montarLink(String codigo) {
        String url = UriComponentsBuilder.fromUriString(frontendBaseUrl)
                .path("/vip/roleta")
                .queryParam("ref", codigo)
                .toUriString();

        return new IndicacaoLinkResponse(codigo, url);
    }

    private Optional<IndicacaoConversao> processarRecompensa(IndicacaoConversao conversao) {
        if (roletaIndicacaoRecompensaService != null) {
            roletaIndicacaoRecompensaService.processarConversao(conversao);
        }

        return Optional.of(conversao);
    }

    private Usuario buscarUsuarioIndicadoAtualizado(Usuario usuarioIndicado) {
        if (usuarioIndicado.getId() == null) {
            return usuarioIndicado;
        }

        return usuarioRepository.findByIdForUpdate(usuarioIndicado.getId())
                .orElse(usuarioIndicado);
    }

    private Optional<String> obterCodigoLegadoRoleta(Usuario usuario) {
        return roletaParticipanteRepository.findByUsuarioId(usuario.getId())
                .map(participante -> participante.getCodigoConvite() == null
                        ? null
                        : participante.getCodigoConvite().trim().toLowerCase())
                .filter(codigo -> !codigo.isBlank())
                .filter(codigo -> usuarioRepository.findByCodigoIndicacao(codigo)
                        .map(dono -> dono.getId().equals(usuario.getId()))
                        .orElse(true));
    }

    private Optional<Usuario> buscarIndicadorPorCodigo(String codigoNormalizado) {
        Optional<Usuario> usuarioComCodigo = usuarioRepository.findByCodigoIndicacao(codigoNormalizado);
        if (usuarioComCodigo.isPresent()) {
            return usuarioComCodigo;
        }

        return roletaParticipanteRepository.findByCodigoConvite(codigoNormalizado)
                .map(participante -> {
                    Usuario usuario = participante.getUsuario();
                    if (usuario.getCodigoIndicacao() == null || usuario.getCodigoIndicacao().isBlank()) {
                        usuario.setCodigoIndicacao(codigoNormalizado);
                        return usuarioRepository.save(usuario);
                    }
                    return usuario;
                });
    }

    private String gerarCodigoUnico() {
        for (int tentativa = 0; tentativa < MAX_TENTATIVAS_GERACAO; tentativa++) {
            String codigo = gerarCodigo();
            if (!usuarioRepository.existsByCodigoIndicacao(codigo)
                    && !roletaParticipanteRepository.existsByCodigoConvite(codigo)) {
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
