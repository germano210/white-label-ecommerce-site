package com.whiteLabel.backend.service;

import com.whiteLabel.backend.domain.Produto;
import com.whiteLabel.backend.domain.RoletaConfig;
import com.whiteLabel.backend.domain.RoletaConvite;
import com.whiteLabel.backend.domain.RoletaConviteStatus;
import com.whiteLabel.backend.domain.RoletaGiro;
import com.whiteLabel.backend.domain.RoletaGiroStatus;
import com.whiteLabel.backend.domain.RoletaParticipante;
import com.whiteLabel.backend.domain.RoletaProduto;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.dto.AdminRoletaRequest;
import com.whiteLabel.backend.dto.AdminRoletaResponse;
import com.whiteLabel.backend.dto.ProdutoResponseDTO;
import com.whiteLabel.backend.dto.RoletaConvitesRequest;
import com.whiteLabel.backend.dto.RoletaConvitesResponse;
import com.whiteLabel.backend.dto.RoletaGiroResponse;
import com.whiteLabel.backend.dto.RoletaNotificacaoResponse;
import com.whiteLabel.backend.dto.RoletaPremioFaixaResponse;
import com.whiteLabel.backend.dto.RoletaPremioResponse;
import com.whiteLabel.backend.dto.RoletaStatusResponse;
import com.whiteLabel.backend.repository.ProdutoRepository;
import com.whiteLabel.backend.repository.RoletaConfigRepository;
import com.whiteLabel.backend.repository.RoletaConviteRepository;
import com.whiteLabel.backend.repository.RoletaGiroRepository;
import com.whiteLabel.backend.repository.RoletaParticipanteRepository;
import com.whiteLabel.backend.repository.RoletaProdutoRepository;
import com.whiteLabel.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class RoletaService {

    private static final Long CONFIG_ID = 1L;
    private static final String ALFABETO = "abcdefghijklmnopqrstuvwxyz0123456789";
    private static final int TAMANHO_CODIGO = 16;
    private static final int MAX_TENTATIVAS_GERACAO = 20;
    private static final List<FaixaDesconto> FAIXAS_PADRAO = List.of(
            new FaixaDesconto("0.82", "1.60"),
            new FaixaDesconto("1.14", "3.36"),
            new FaixaDesconto("5.50", "7.82"),
            new FaixaDesconto("8.64", "9.99"),
            new FaixaDesconto("10.29", "15.37"),
            new FaixaDesconto("14.76", "17.52"),
            new FaixaDesconto("19.86", "24.42"),
            new FaixaDesconto("25.33", "29.36"),
            new FaixaDesconto("30.38", "38.13"),
            new FaixaDesconto("47.73", "52.62"),
            new FaixaDesconto("52.93", "65.22"),
            new FaixaDesconto("72.41", "80.63")
    );

    private final RoletaConfigRepository roletaConfigRepository;
    private final RoletaProdutoRepository roletaProdutoRepository;
    private final RoletaParticipanteRepository roletaParticipanteRepository;
    private final RoletaGiroRepository roletaGiroRepository;
    private final RoletaConviteRepository roletaConviteRepository;
    private final ProdutoRepository produtoRepository;
    private final ProdutoService produtoService;
    private final UsuarioRepository usuarioRepository;
    private final SecureRandom secureRandom;
    private final Clock clock;
    private final String frontendBaseUrl;

    public RoletaService(
            RoletaConfigRepository roletaConfigRepository,
            RoletaProdutoRepository roletaProdutoRepository,
            RoletaParticipanteRepository roletaParticipanteRepository,
            RoletaGiroRepository roletaGiroRepository,
            RoletaConviteRepository roletaConviteRepository,
            ProdutoRepository produtoRepository,
            ProdutoService produtoService,
            UsuarioRepository usuarioRepository,
            @Value("${app.frontend.public-base-url:https://brechodacami.com}") String frontendBaseUrl
    ) {
        this.roletaConfigRepository = roletaConfigRepository;
        this.roletaProdutoRepository = roletaProdutoRepository;
        this.roletaParticipanteRepository = roletaParticipanteRepository;
        this.roletaGiroRepository = roletaGiroRepository;
        this.roletaConviteRepository = roletaConviteRepository;
        this.produtoRepository = produtoRepository;
        this.produtoService = produtoService;
        this.usuarioRepository = usuarioRepository;
        this.secureRandom = new SecureRandom();
        this.clock = Clock.systemDefaultZone();
        this.frontendBaseUrl = normalizarBaseUrl(frontendBaseUrl);
    }

    @Transactional
    public RoletaStatusResponse obterStatus() {
        RoletaConfig config = obterConfig();
        RoletaParticipante participante = obterUsuarioAutenticadoOptional()
                .map(usuario -> garantirParticipante(usuario, config))
                .orElse(null);

        return montarStatus(config, participante);
    }

    @Transactional
    public RoletaGiroResponse girar() {
        Usuario usuario = obterUsuarioAutenticado();
        RoletaConfig config = obterConfigForUpdate();

        if (!Boolean.TRUE.equals(config.getAtiva())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Roleta inativa");
        }

        RoletaParticipante participante = garantirParticipanteForUpdate(usuario, config);
        LocalDateTime now = LocalDateTime.now(clock);

        if (participante.getGirosDisponiveis() > 0) {
            participante.consumirGiro();
        } else if (isGiroDiarioDisponivel(participante, config, now)) {
            participante.setUltimoGiroDiarioEm(now);
            participante.adicionarGirosAoHistorico(config.getGiroDiarioQuantidade());
            participante.adicionarGirosDisponiveis(config.getGiroDiarioQuantidade() - 1);
        } else {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Usuario sem giros disponiveis");
        }

        BigDecimal valorDesconto = sortearDesconto();
        RoletaGiro giro = roletaGiroRepository.save(new RoletaGiro(usuario, valorDesconto));
        participante.adicionarValorDisponivel(valorDesconto);

        incrementarProgressoGrupo(config);
        roletaParticipanteRepository.save(participante);
        roletaConfigRepository.save(config);

        return new RoletaGiroResponse(
                RoletaPremioResponse.from(giro),
                montarStatus(config, participante)
        );
    }

    @Transactional(readOnly = true)
    public List<ProdutoResponseDTO> listarProdutosRoleta() {
        return montarProdutosSelecionados();
    }

    @Transactional
    public RoletaConvitesResponse obterConvites() {
        Usuario usuario = obterUsuarioAutenticado();
        RoletaConfig config = obterConfig();
        RoletaParticipante participante = garantirParticipante(usuario, config);

        return montarConvitesResponse(config, participante);
    }

    @Transactional
    public RoletaConvitesResponse registrarConvite(RoletaConvitesRequest request) {
        Usuario usuarioIndicado = obterUsuarioAutenticado();
        RoletaConfig config = obterConfig();
        RoletaParticipante participanteIndicado = garantirParticipante(usuarioIndicado, config);
        String codigo = normalizarCodigo(request.codigoConvite());

        RoletaParticipante participanteIndicador = roletaParticipanteRepository.findByCodigoConviteForUpdate(codigo)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Codigo de convite da roleta nao encontrado"
                ));

        Usuario usuarioIndicador = participanteIndicador.getUsuario();
        if (usuarioIndicador.getId().equals(usuarioIndicado.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Usuario nao pode usar o proprio convite"
            );
        }

        if (!roletaConviteRepository.existsByUsuarioIndicadoId(usuarioIndicado.getId())) {
            int girosConcedidos = config.getGirosGanhosPorConvite();
            roletaConviteRepository.save(new RoletaConvite(
                    codigo,
                    usuarioIndicador,
                    usuarioIndicado,
                    RoletaConviteStatus.CONVERTIDO,
                    girosConcedidos
            ));
            participanteIndicador.incrementarConvitesConvertidos();
            participanteIndicador.adicionarGiros(girosConcedidos);
            roletaParticipanteRepository.save(participanteIndicador);
        }

        return montarConvitesResponse(config, participanteIndicado);
    }

    @Transactional
    public AdminRoletaResponse obterAdmin() {
        RoletaConfig config = obterConfig();
        return montarAdminResponse(config);
    }

    @Transactional
    public AdminRoletaResponse atualizarAdmin(AdminRoletaRequest request) {
        RoletaConfig config = obterConfigForUpdate();

        if (request.ativa() != null) {
            config.setAtiva(request.ativa());
        }
        if (request.titulo() != null) {
            config.setTitulo(request.titulo());
        }
        if (request.metaGrupo() != null) {
            config.setMetaGrupo(request.metaGrupo());
            if (config.getProgressoGrupo() >= config.getMetaGrupo()) {
                config.setProgressoGrupo(config.getProgressoGrupo() % config.getMetaGrupo());
            }
        }
        if (request.girosBonusGrupo() != null) {
            config.setGirosBonusGrupo(request.girosBonusGrupo());
        }
        if (request.girosIniciais() != null) {
            config.setGirosIniciais(request.girosIniciais());
        }
        if (request.giroDiarioQuantidade() != null) {
            config.setGiroDiarioQuantidade(request.giroDiarioQuantidade());
        }
        if (request.giroDiarioSomenteQuandoZerar() != null) {
            config.setGiroDiarioSomenteQuandoZerar(request.giroDiarioSomenteQuandoZerar());
        }
        if (request.girosGanhosPorConvite() != null) {
            config.setGirosGanhosPorConvite(request.girosGanhosPorConvite());
        }
        if (request.produtoIds() != null) {
            atualizarProdutosSelecionados(request.produtoIds());
        }

        return montarAdminResponse(roletaConfigRepository.save(config));
    }

    private RoletaConfig obterConfig() {
        return roletaConfigRepository.findById(CONFIG_ID)
                .orElseGet(() -> roletaConfigRepository.save(criarConfigPadrao()));
    }

    private RoletaConfig obterConfigForUpdate() {
        return roletaConfigRepository.findByIdForUpdate(CONFIG_ID)
                .orElseGet(() -> roletaConfigRepository.save(criarConfigPadrao()));
    }

    private RoletaConfig criarConfigPadrao() {
        RoletaConfig config = new RoletaConfig();
        config.setId(CONFIG_ID);
        return config;
    }

    private RoletaParticipante garantirParticipante(Usuario usuario, RoletaConfig config) {
        return roletaParticipanteRepository.findByUsuarioId(usuario.getId())
                .orElseGet(() -> roletaParticipanteRepository.save(new RoletaParticipante(
                        usuario,
                        gerarCodigoUnico(),
                        config.getGirosIniciais()
                )));
    }

    private RoletaParticipante garantirParticipanteForUpdate(Usuario usuario, RoletaConfig config) {
        return roletaParticipanteRepository.findByUsuarioIdForUpdate(usuario.getId())
                .orElseGet(() -> roletaParticipanteRepository.save(new RoletaParticipante(
                        usuario,
                        gerarCodigoUnico(),
                        config.getGirosIniciais()
                )));
    }

    private void incrementarProgressoGrupo(RoletaConfig config) {
        int meta = config.getMetaGrupo();
        int progresso = config.getProgressoGrupo() + 1;

        if (progresso >= meta) {
            config.setProgressoGrupo(progresso % meta);
            int bonus = config.getGirosBonusGrupo();
            if (bonus > 0) {
                List<RoletaParticipante> participantes = roletaParticipanteRepository.findAll();
                participantes.forEach(participante -> participante.adicionarGiros(bonus));
                roletaParticipanteRepository.saveAll(participantes);
            }
            return;
        }

        config.setProgressoGrupo(progresso);
    }

    private RoletaStatusResponse montarStatus(
            RoletaConfig config,
            RoletaParticipante participante
    ) {
        LocalDateTime now = LocalDateTime.now(clock);
        RoletaPremioResponse premioPendente = participante == null
                ? null
                : roletaGiroRepository
                .findTopByUsuarioIdAndStatusOrderByCriadoEmDesc(
                        participante.getUsuario().getId(),
                        RoletaGiroStatus.PENDENTE
                )
                .map(RoletaPremioResponse::from)
                .orElse(null);

        long convitesConvertidos = participante == null
                ? 0L
                : roletaConviteRepository.countByUsuarioIndicadorIdAndStatus(
                        participante.getUsuario().getId(),
                        RoletaConviteStatus.CONVERTIDO
                );

        return new RoletaStatusResponse(
                null,
                montarNotificacoes(),
                participante == null ? 0 : participante.getGirosTotaisObtidos(),
                participante == null ? 0 : participante.getGirosDisponiveis(),
                participante == null ? BigDecimal.ZERO : participante.getValorDisponivelResgate(),
                participante == null ? BigDecimal.ZERO : participante.getValorTotalResgatado(),
                config.getMetaGrupo(),
                config.getProgressoGrupo(),
                config.getGirosBonusGrupo(),
                participante == null ? null : participante.getCodigoConvite(),
                participante == null ? null : montarUrlConvite(participante.getCodigoConvite()),
                convitesConvertidos,
                config.getGirosGanhosPorConvite(),
                config.getAtiva(),
                config.getTitulo(),
                participante != null && isGiroDiarioDisponivel(participante, config, now),
                participante == null ? null : calcularProximoGiroDiarioEm(participante, config, now),
                premioPendente,
                montarUltimosEventos(),
                montarPremiosEmJogo()
        );
    }

    private List<RoletaNotificacaoResponse> montarNotificacoes() {
        return List.of();
    }

    private List<String> montarUltimosEventos() {
        return roletaGiroRepository.findTop3ByOrderByCriadoEmDesc()
                .stream()
                .map(giro -> "Um membro ganhou "
                        + RoletaPremioResponse.from(giro).valorFormatado()
                        + " OFF")
                .toList();
    }

    private List<RoletaPremioFaixaResponse> montarPremiosEmJogo() {
        return FAIXAS_PADRAO.stream()
                .map(faixa -> RoletaPremioFaixaResponse.from(faixa.minimo(), faixa.maximo()))
                .toList();
    }

    private boolean isGiroDiarioDisponivel(
            RoletaParticipante participante,
            RoletaConfig config,
            LocalDateTime now
    ) {
        if (config.getGiroDiarioQuantidade() <= 0) {
            return false;
        }

        if (Boolean.TRUE.equals(config.getGiroDiarioSomenteQuandoZerar())
                && participante.getGirosDisponiveis() > 0) {
            return false;
        }

        LocalDateTime ultimoGiro = participante.getUltimoGiroDiarioEm();
        if (ultimoGiro == null) {
            return true;
        }

        LocalDate hoje = now.toLocalDate();
        return ultimoGiro.toLocalDate().isBefore(hoje);
    }

    private LocalDateTime calcularProximoGiroDiarioEm(
            RoletaParticipante participante,
            RoletaConfig config,
            LocalDateTime now
    ) {
        if (isGiroDiarioDisponivel(participante, config, now)) {
            return null;
        }

        if (Boolean.TRUE.equals(config.getGiroDiarioSomenteQuandoZerar())
                && participante.getGirosDisponiveis() > 0) {
            return null;
        }

        LocalDateTime ultimoGiro = participante.getUltimoGiroDiarioEm();
        if (ultimoGiro == null) {
            return null;
        }

        return ultimoGiro.toLocalDate().plusDays(1).atStartOfDay();
    }

    private BigDecimal sortearDesconto() {
        FaixaDesconto faixa = FAIXAS_PADRAO.get(secureRandom.nextInt(FAIXAS_PADRAO.size()));
        int minCents = faixa.minimo().movePointRight(2).intValue();
        int maxCents = faixa.maximo().movePointRight(2).intValue();
        int cents = secureRandom.nextInt(maxCents - minCents + 1) + minCents;

        return BigDecimal.valueOf(cents, 2);
    }

    private List<ProdutoResponseDTO> montarProdutosSelecionados() {
        List<Long> idsOrdenados = roletaProdutoRepository.findByAtivoTrueOrderByOrdemAscIdAsc()
                .stream()
                .map(roletaProduto -> roletaProduto.getProduto().getId())
                .toList();

        if (idsOrdenados.isEmpty()) {
            return List.of();
        }

        Map<Long, ProdutoResponseDTO> produtosAtivos = produtoService.listarAtivos()
                .stream()
                .collect(Collectors.toMap(ProdutoResponseDTO::id, Function.identity()));

        return idsOrdenados.stream()
                .map(produtosAtivos::get)
                .filter(Objects::nonNull)
                .toList();
    }

    private void atualizarProdutosSelecionados(List<Long> produtoIds) {
        Set<Long> idsUnicos = produtoIds.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        List<Produto> produtos = produtoRepository.findAllById(idsUnicos);
        Map<Long, Produto> produtosPorId = produtos.stream()
                .collect(Collectors.toMap(Produto::getId, Function.identity()));

        List<RoletaProduto> proximosProdutos = new ArrayList<>();
        int ordem = 0;
        for (Long produtoId : idsUnicos) {
            Produto produto = produtosPorId.get(produtoId);
            if (produto == null) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Produto da roleta nao encontrado: " + produtoId
                );
            }
            if (!Boolean.TRUE.equals(produto.getAtivo())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Produto inativo nao pode entrar na roleta: " + produtoId
                );
            }

            proximosProdutos.add(new RoletaProduto(produto, ordem));
            ordem++;
        }

        roletaProdutoRepository.deleteAllInBatch();
        roletaProdutoRepository.flush();
        roletaProdutoRepository.saveAll(proximosProdutos);
    }

    private AdminRoletaResponse montarAdminResponse(RoletaConfig config) {
        List<ProdutoResponseDTO> produtos = montarProdutosSelecionados();

        return new AdminRoletaResponse(
                config.getAtiva(),
                config.getTitulo(),
                config.getMetaGrupo(),
                config.getProgressoGrupo(),
                config.getGirosBonusGrupo(),
                config.getGirosIniciais(),
                config.getGiroDiarioQuantidade(),
                config.getGiroDiarioSomenteQuandoZerar(),
                config.getGirosGanhosPorConvite(),
                config.getAtualizadaEm(),
                produtos.stream().map(ProdutoResponseDTO::id).toList(),
                produtos
        );
    }

    private RoletaConvitesResponse montarConvitesResponse(
            RoletaConfig config,
            RoletaParticipante participante
    ) {
        long quantidadeConvertida = roletaConviteRepository.countByUsuarioIndicadorIdAndStatus(
                participante.getUsuario().getId(),
                RoletaConviteStatus.CONVERTIDO
        );

        return new RoletaConvitesResponse(
                participante.getCodigoConvite(),
                montarUrlConvite(participante.getCodigoConvite()),
                quantidadeConvertida,
                quantidadeConvertida,
                config.getGirosGanhosPorConvite(),
                config.getGirosGanhosPorConvite()
        );
    }

    private String montarUrlConvite(String codigo) {
        return UriComponentsBuilder.fromUriString(frontendBaseUrl)
                .path("/vip/roleta")
                .queryParam("ref", codigo)
                .toUriString();
    }

    private String gerarCodigoUnico() {
        for (int tentativa = 0; tentativa < MAX_TENTATIVAS_GERACAO; tentativa++) {
            String codigo = gerarCodigo();
            if (!roletaParticipanteRepository.existsByCodigoConvite(codigo)) {
                return codigo;
            }
        }

        throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Nao foi possivel gerar codigo da roleta"
        );
    }

    private String gerarCodigo() {
        StringBuilder codigo = new StringBuilder(TAMANHO_CODIGO);
        for (int indice = 0; indice < TAMANHO_CODIGO; indice++) {
            codigo.append(ALFABETO.charAt(secureRandom.nextInt(ALFABETO.length())));
        }
        return codigo.toString();
    }

    private String normalizarCodigo(String codigo) {
        if (codigo == null || codigo.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Codigo de convite e obrigatorio"
            );
        }

        return codigo.trim().toLowerCase(Locale.ROOT);
    }

    private Optional<Usuario> obterUsuarioAutenticadoOptional() {
        return obterUsuarioAutenticadoIdOptional()
                .flatMap(usuarioRepository::findById);
    }

    private Usuario obterUsuarioAutenticado() {
        return usuarioRepository.findById(obterUsuarioAutenticadoId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Usuario autenticado nao encontrado"
                ));
    }

    private UUID obterUsuarioAutenticadoId() {
        return obterUsuarioAutenticadoIdOptional()
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Usuario nao autenticado"
                ));
    }

    private Optional<UUID> obterUsuarioAutenticadoIdOptional() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }

        try {
            return Optional.of(UUID.fromString(authentication.getName()));
        } catch (IllegalArgumentException exception) {
            return Optional.empty();
        }
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

    private record FaixaDesconto(BigDecimal minimo, BigDecimal maximo) {

        private FaixaDesconto(String minimo, String maximo) {
            this(new BigDecimal(minimo), new BigDecimal(maximo));
        }
    }
}
