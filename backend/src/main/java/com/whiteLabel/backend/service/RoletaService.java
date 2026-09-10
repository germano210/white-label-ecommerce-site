package com.whiteLabel.backend.service;

import com.whiteLabel.backend.domain.Produto;
import com.whiteLabel.backend.domain.Pedido;
import com.whiteLabel.backend.domain.ProdutoStatus;
import com.whiteLabel.backend.domain.RoletaConfig;
import com.whiteLabel.backend.domain.RoletaGiro;
import com.whiteLabel.backend.domain.RoletaGiroCredito;
import com.whiteLabel.backend.domain.RoletaGiroStatus;
import com.whiteLabel.backend.domain.RoletaNivel;
import com.whiteLabel.backend.domain.RoletaOpcao;
import com.whiteLabel.backend.domain.RoletaParticipante;
import com.whiteLabel.backend.domain.RoletaPremio;
import com.whiteLabel.backend.domain.RoletaProduto;
import com.whiteLabel.backend.domain.RoletaTipoPremio;
import com.whiteLabel.backend.domain.Usuario;
import com.whiteLabel.backend.dto.AdminRoletaNivelRequest;
import com.whiteLabel.backend.dto.AdminRoletaNivelResponse;
import com.whiteLabel.backend.dto.AdminRoletaOpcaoRequest;
import com.whiteLabel.backend.dto.AdminRoletaOpcaoResponse;
import com.whiteLabel.backend.dto.AdminRoletaPremioRequest;
import com.whiteLabel.backend.dto.AdminRoletaPremioResponse;
import com.whiteLabel.backend.dto.AdminRoletaRequest;
import com.whiteLabel.backend.dto.AdminRoletaResponse;
import com.whiteLabel.backend.dto.CheckoutResponse;
import com.whiteLabel.backend.dto.IndicacaoLinkResponse;
import com.whiteLabel.backend.dto.ProdutoResponseDTO;
import com.whiteLabel.backend.dto.RoletaConvitesRequest;
import com.whiteLabel.backend.dto.RoletaConvitesResponse;
import com.whiteLabel.backend.dto.RoletaGiroResponse;
import com.whiteLabel.backend.dto.RoletaMetaResponse;
import com.whiteLabel.backend.dto.RoletaNotificacaoResponse;
import com.whiteLabel.backend.dto.RoletaNivelResponse;
import com.whiteLabel.backend.dto.RoletaOpcaoResponse;
import com.whiteLabel.backend.dto.RoletaPremioConfiguradoResponse;
import com.whiteLabel.backend.dto.RoletaPremioFaixaResponse;
import com.whiteLabel.backend.dto.RoletaPremioResponse;
import com.whiteLabel.backend.dto.RoletaSaqueResponse;
import com.whiteLabel.backend.dto.RoletaStatusResponse;
import com.whiteLabel.backend.repository.ProdutoRepository;
import com.whiteLabel.backend.repository.RoletaConfigRepository;
import com.whiteLabel.backend.repository.RoletaGiroCreditoRepository;
import com.whiteLabel.backend.repository.RoletaGiroRepository;
import com.whiteLabel.backend.repository.RoletaNivelRepository;
import com.whiteLabel.backend.repository.RoletaOpcaoRepository;
import com.whiteLabel.backend.repository.RoletaParticipanteRepository;
import com.whiteLabel.backend.repository.RoletaPremioRepository;
import com.whiteLabel.backend.repository.RoletaProdutoRepository;
import com.whiteLabel.backend.repository.UsuarioRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
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
    private final RoletaGiroCreditoRepository roletaGiroCreditoRepository;
    private final RoletaNivelRepository roletaNivelRepository;
    private final RoletaOpcaoRepository roletaOpcaoRepository;
    private final RoletaPremioRepository roletaPremioRepository;
    private final ProdutoRepository produtoRepository;
    private final ProdutoService produtoService;
    private final PedidoService pedidoService;
    private final RoletaMetaService roletaMetaService;
    private final RoletaInteracaoService roletaInteracaoService;
    private final IndicacaoService indicacaoService;
    private final UsuarioRepository usuarioRepository;
    private final SecureRandom secureRandom;
    private final Clock clock;

    public RoletaService(
            RoletaConfigRepository roletaConfigRepository,
            RoletaProdutoRepository roletaProdutoRepository,
            RoletaParticipanteRepository roletaParticipanteRepository,
            RoletaGiroRepository roletaGiroRepository,
            RoletaGiroCreditoRepository roletaGiroCreditoRepository,
            RoletaNivelRepository roletaNivelRepository,
            RoletaOpcaoRepository roletaOpcaoRepository,
            RoletaPremioRepository roletaPremioRepository,
            ProdutoRepository produtoRepository,
            ProdutoService produtoService,
            PedidoService pedidoService,
            RoletaMetaService roletaMetaService,
            RoletaInteracaoService roletaInteracaoService,
            IndicacaoService indicacaoService,
            UsuarioRepository usuarioRepository
    ) {
        this.roletaConfigRepository = roletaConfigRepository;
        this.roletaProdutoRepository = roletaProdutoRepository;
        this.roletaParticipanteRepository = roletaParticipanteRepository;
        this.roletaGiroRepository = roletaGiroRepository;
        this.roletaGiroCreditoRepository = roletaGiroCreditoRepository;
        this.roletaNivelRepository = roletaNivelRepository;
        this.roletaOpcaoRepository = roletaOpcaoRepository;
        this.roletaPremioRepository = roletaPremioRepository;
        this.produtoRepository = produtoRepository;
        this.produtoService = produtoService;
        this.pedidoService = pedidoService;
        this.roletaMetaService = roletaMetaService;
        this.roletaInteracaoService = roletaInteracaoService;
        this.indicacaoService = indicacaoService;
        this.usuarioRepository = usuarioRepository;
        this.secureRandom = new SecureRandom();
        this.clock = Clock.systemDefaultZone();
    }

    @Transactional
    public RoletaStatusResponse obterStatus() {
        RoletaConfig config = obterConfigSomenteLeitura();
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
            creditarGiros(
                    participante,
                    config.getGiroDiarioQuantidade(),
                    chaveGiroDiario(usuario, now.toLocalDate())
            );
            participante.setUltimoGiroDiarioEm(now);
            if (participante.getGirosDisponiveis() <= 0) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Usuario sem giros disponiveis");
            }
            participante.consumirGiro();
        } else {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Usuario sem giros disponiveis");
        }

        List<RoletaPremio> premiosAtivos = buscarPremiosAtivosValidos();
        List<RoletaNivel> niveisAtivos = buscarNiveisAtivosValidos(premiosAtivos);
        RoletaNivel nivelSorteado = sortearNivel(niveisAtivos);
        RoletaPremio premioSorteado = sortearPremio(premiosDoNivel(premiosAtivos, nivelSorteado));
        PremioCalculado premioCalculado = calcularPremio(premioSorteado);
        descartarPremiosPendentes(usuario.getId());
        RoletaGiro giro = roletaGiroRepository.save(new RoletaGiro(
                usuario,
                nivelSorteado,
                premioSorteado,
                premioCalculado.valorPremio(),
                premioCalculado.girosExtras()
        ));

        if (premioSorteado.getTipoPremio() == RoletaTipoPremio.GIRO_EXTRA) {
            creditarGiros(
                    participante,
                    premioCalculado.girosExtras(),
                    "PREMIO_GIRO:" + giro.getId()
            );
        }

        roletaInteracaoService.registrarGiroRoleta(usuario, giro);
        roletaInteracaoService.registrarPremioRecebido(usuario, nivelSorteado, premioSorteado, giro);
        roletaParticipanteRepository.save(participante);
        roletaConfigRepository.save(config);

        RoletaPremioResponse premio = RoletaPremioResponse.from(giro);
        Map<Long, BigDecimal> chances = calcularChances(niveisAtivos);
        return new RoletaGiroResponse(
                premio,
                premio,
                premio,
                null,
                RoletaNivelResponse.from(nivelSorteado, chances.getOrDefault(nivelSorteado.getId(), BigDecimal.ZERO)),
                nivelSorteado.getCorHex(),
                RoletaPremioConfiguradoResponse.from(premioSorteado),
                premioCalculado.valorPremio(),
                participante.getGirosDisponiveis(),
                montarStatus(config, participante)
        );
    }

    @Transactional(readOnly = true)
    public List<ProdutoResponseDTO> listarProdutosRoleta() {
        return montarProdutosSelecionados();
    }

    @Transactional
    public CheckoutResponse resgatarProduto(Long produtoId) {
        Usuario usuario = obterUsuarioAutenticado();
        Produto produto = produtoRepository.findById(produtoId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Produto nao encontrado"
                ));
        if (produto.getStatus() == ProdutoStatus.VENDIDO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Produto ja vendido");
        }
        if (!Boolean.TRUE.equals(produto.getAtivo()) || produto.getStatus() == ProdutoStatus.INATIVO) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Produto indisponivel para checkout");
        }

        if (!roletaProdutoRepository.existsByProdutoIdAndAtivoTrue(produtoId)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Produto nao pertence aos produtos ativos da roleta"
            );
        }

        RoletaGiro premioAtual = obterPremioAtualForUpdate(usuario).orElse(null);

        return pedidoService.criarCheckoutProdutoRoleta(
                usuario,
                produto,
                premioAtual
        );
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
        indicacaoService.registrarConversaoObrigatoria(usuarioIndicado, request.codigoConvite());
        RoletaParticipante participanteIndicado = garantirParticipanteForUpdate(usuarioIndicado, config);

        return montarConvitesResponse(config, participanteIndicado);
    }

    @Transactional
    public void creditarComissaoIndicacao(Pedido pedido, BigDecimal valorPago) {
        if (pedido == null || pedido.getUsuario() == null) {
            return;
        }

        Usuario comprador = pedido.getUsuario();
        Usuario indicador = comprador.getIndicadoPor();
        if (indicador == null && comprador.getId() != null) {
            indicador = usuarioRepository.findById(comprador.getId())
                    .map(Usuario::getIndicadoPor)
                    .orElse(null);
        }
        if (indicador == null || indicador.getId().equals(comprador.getId())) {
            return;
        }

        RoletaConfig config = obterConfig();
        BigDecimal percentual = config.getPercentualComissaoIndicacao();
        if (percentual.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        BigDecimal comissao = normalizarValorPago(valorPago, pedido)
                .multiply(percentual)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        if (comissao.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        RoletaParticipante participanteIndicador = garantirParticipanteForUpdate(indicador, config);
        participanteIndicador.adicionarValorDisponivel(comissao);
        roletaParticipanteRepository.save(participanteIndicador);
    }

    @Transactional(readOnly = true)
    public AdminRoletaResponse obterAdmin() {
        RoletaConfig config = obterConfigSomenteLeitura();
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
        if (request.girosPorConviteMin() != null) {
            config.setGirosPorConviteMin(request.girosPorConviteMin());
        }
        if (request.girosPorConviteMax() != null) {
            config.setGirosPorConviteMax(request.girosPorConviteMax());
        }
        if (request.percentualComissaoIndicacao() != null) {
            config.setPercentualComissaoIndicacao(request.percentualComissaoIndicacao());
        }
        if (request.multiplicadorDificuldadePadrao() != null) {
            validarMultiplicadorDificuldade(request.multiplicadorDificuldadePadrao());
            config.setMultiplicadorDificuldadePadrao(request.multiplicadorDificuldadePadrao());
        }
        if (request.usarPesosManuais() != null) {
            config.setUsarPesosManuais(request.usarPesosManuais());
        }
        if (deveAtualizarProdutosSelecionados(request)) {
            atualizarProdutosSelecionados(request.produtoIds());
        }
        if (deveAtualizarNiveis(request)) {
            atualizarNiveis(
                    config,
                    request.niveis() == null ? List.of() : request.niveis()
            );
        }

        return montarAdminResponse(roletaConfigRepository.save(config));
    }

    private boolean deveAtualizarProdutosSelecionados(AdminRoletaRequest request) {
        return request.produtoIds() != null
                && (!request.produtoIds().isEmpty() || Boolean.TRUE.equals(request.atualizarProdutos()));
    }

    private boolean deveAtualizarNiveis(AdminRoletaRequest request) {
        return Boolean.TRUE.equals(request.atualizarNiveis());
    }

    private RoletaConfig obterConfig() {
        return roletaConfigRepository.findById(CONFIG_ID)
                .orElseGet(() -> roletaConfigRepository.save(criarConfigPadrao()));
    }

    private RoletaConfig obterConfigSomenteLeitura() {
        return roletaConfigRepository.findById(CONFIG_ID)
                .orElseGet(this::criarConfigPadrao);
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

    private void validarMultiplicadorDificuldade(BigDecimal multiplicador) {
        if (multiplicador.compareTo(BigDecimal.ONE) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Multiplicador de dificuldade deve ser maior que 1"
            );
        }
    }

    private RoletaParticipante garantirParticipante(Usuario usuario, RoletaConfig config) {
        return roletaParticipanteRepository.findByUsuarioId(usuario.getId())
                .orElseGet(() -> criarParticipanteComCreditoInicial(usuario, config));
    }

    private RoletaParticipante garantirParticipanteForUpdate(Usuario usuario, RoletaConfig config) {
        return roletaParticipanteRepository.findByUsuarioIdForUpdate(usuario.getId())
                .orElseGet(() -> criarParticipanteComCreditoInicial(usuario, config));
    }

    private RoletaParticipante criarParticipanteComCreditoInicial(Usuario usuario, RoletaConfig config) {
        Usuario usuarioBloqueado = usuarioRepository.findByIdForUpdate(usuario.getId())
                .orElse(usuario);
        Optional<RoletaParticipante> participanteExistente =
                roletaParticipanteRepository.findByUsuarioId(usuario.getId());
        if (participanteExistente.isPresent()) {
            return participanteExistente.get();
        }

        RoletaParticipante participante = salvarNovoParticipante(usuarioBloqueado);
        creditarGiros(participante, config.getGirosIniciais(), "INICIAL:" + usuario.getId());
        return participante;
    }

    private RoletaParticipante salvarNovoParticipante(Usuario usuario) {
        try {
            return roletaParticipanteRepository.saveAndFlush(new RoletaParticipante(
                    usuario,
                    indicacaoService.garantirCodigoIndicacao(usuario),
                    0
            ));
        } catch (DataIntegrityViolationException exception) {
            return roletaParticipanteRepository.findByUsuarioId(usuario.getId())
                    .orElseThrow(() -> exception);
        }
    }

    private void incrementarProgressoGrupo(RoletaConfig config) {
        int meta = config.getMetaGrupo();
        int progresso = config.getProgressoGrupo() + 1;

        if (progresso >= meta) {
            config.setProgressoGrupo(progresso % meta);
            int ciclo = config.avancarCicloMetaGrupo();
            int bonus = config.getGirosBonusGrupo();
            if (bonus > 0) {
                List<RoletaParticipante> participantes = roletaParticipanteRepository.findAll();
                participantes.forEach(participante -> creditarGiros(
                        participante,
                        bonus,
                        "META_GRUPO:" + ciclo + ":" + participante.getUsuario().getId()
                ));
                roletaParticipanteRepository.saveAll(participantes);
            }
            return;
        }

        config.setProgressoGrupo(progresso);
    }

    private boolean creditarGiros(
            RoletaParticipante participante,
            Integer quantidade,
            String chaveEvento
    ) {
        int giros = Math.max(0, quantidade == null ? 0 : quantidade);
        if (giros <= 0 || chaveEvento == null || chaveEvento.isBlank()) {
            return false;
        }
        if (roletaGiroCreditoRepository.existsByChaveEvento(chaveEvento)) {
            return false;
        }

        try {
            roletaGiroCreditoRepository.saveAndFlush(new RoletaGiroCredito(
                    participante,
                    chaveEvento,
                    giros
            ));
        } catch (DataIntegrityViolationException exception) {
            return false;
        }

        participante.adicionarGiros(giros);
        return true;
    }

    private void descartarPremiosPendentes(UUID usuarioId) {
        List<RoletaGiro> pendentes = roletaGiroRepository.findByUsuarioIdAndStatusForUpdate(
                usuarioId,
                RoletaGiroStatus.PENDENTE
        );

        pendentes.forEach(RoletaGiro::descartar);
        roletaGiroRepository.saveAll(pendentes);
    }

    private Optional<RoletaGiro> obterPremioAtualForUpdate(Usuario usuario) {
        List<RoletaGiro> pendentes = roletaGiroRepository.findByUsuarioIdAndStatusForUpdate(
                usuario.getId(),
                RoletaGiroStatus.PENDENTE
        );

        if (pendentes.isEmpty()) {
            return Optional.empty();
        }

        RoletaGiro premioAtual = pendentes.get(0);
        if (pendentes.size() > 1) {
            pendentes.stream()
                    .skip(1)
                    .forEach(RoletaGiro::descartar);
            roletaGiroRepository.saveAll(pendentes.subList(1, pendentes.size()));
        }

        return Optional.of(premioAtual);
    }

    private BigDecimal normalizarValorPago(BigDecimal valorPago, Pedido pedido) {
        BigDecimal valor = valorPago == null ? pedido.getValorTotal() : valorPago;
        if (valor == null || valor.compareTo(BigDecimal.ZERO) < 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        return valor.setScale(2, RoundingMode.HALF_UP);
    }

    private RoletaStatusResponse montarStatus(
            RoletaConfig config,
            RoletaParticipante participante
    ) {
        LocalDateTime now = LocalDateTime.now(clock);
        RoletaMetaResponse metaAtual = roletaMetaService.obterMetaAtual().orElse(null);
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
                : usuarioRepository.countByIndicadoPorId(participante.getUsuario().getId());
        IndicacaoLinkResponse linkIndicacao = participante == null
                ? null
                : indicacaoService.obterLink(participante.getUsuario());

        return new RoletaStatusResponse(
                null,
                montarNotificacoes(),
                participante == null ? 0 : participante.getGirosTotaisObtidos(),
                participante == null ? 0 : participante.getGirosDisponiveis(),
                participante == null ? BigDecimal.ZERO : participante.getValorDisponivelResgate(),
                participante == null ? BigDecimal.ZERO : participante.getValorTotalResgatado(),
                metaAtual == null ? config.getMetaGrupo() : metaAtual.quantidadeAlvo(),
                metaAtual == null ? config.getProgressoGrupo() : metaAtual.progressoAtual(),
                metaAtual == null ? config.getGirosBonusGrupo() : metaAtual.girosRecompensa(),
                metaAtual,
                linkIndicacao == null ? null : linkIndicacao.codigo(),
                linkIndicacao == null ? null : linkIndicacao.url(),
                convitesConvertidos,
                config.getGirosGanhosPorConvite(),
                config.getGirosPorConviteMin(),
                config.getGirosPorConviteMax(),
                montarNiveisPublicos(),
                montarOpcoesPublicas(),
                montarPremiosPublicos(),
                config.getAtiva(),
                config.getTitulo(),
                participante != null && isGiroDiarioDisponivel(participante, config, now),
                participante == null ? null : calcularProximoGiroDiarioEm(participante, config, now),
                premioPendente,
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

    private List<RoletaOpcaoResponse> montarOpcoesPublicas() {
        // TODO: roleta_opcoes e legado; remover DTO, repositorio e tabela apos o painel usar apenas niveis/premios.
        return List.of();
    }

    private List<RoletaPremioConfiguradoResponse> montarPremiosPublicos() {
        return roletaPremioRepository.findAtivosComNivelAtivoOrdenados()
                .stream()
                .map(RoletaPremioConfiguradoResponse::from)
                .toList();
    }

    private List<RoletaNivelResponse> montarNiveisPublicos() {
        List<RoletaNivel> niveis = roletaNivelRepository.findByAtivoTrueOrderByOrdemAscIdAsc();
        Map<Long, Long> premiosAtivosPorNivel = contarPremiosAtivosPorNivel();
        Map<Long, BigDecimal> chances = calcularChances(niveis);
        return niveis.stream()
                .map(nivel -> RoletaNivelResponse.from(nivel, chances.getOrDefault(
                        nivel.getId(),
                        BigDecimal.ZERO
                ), premiosAtivosPorNivel.getOrDefault(nivel.getId(), 0L)))
                .toList();
    }

    private List<AdminRoletaNivelResponse> montarNiveisAdmin() {
        List<RoletaNivel> niveis = roletaNivelRepository.findAllByOrderByOrdemAscIdAsc();
        Map<Long, Long> premiosAtivosPorNivel = contarPremiosAtivosPorNivel();
        Map<Long, BigDecimal> chances = calcularChances(niveis.stream()
                .filter(nivel -> Boolean.TRUE.equals(nivel.getAtivo()))
                .toList());
        Map<Long, List<AdminRoletaPremioResponse>> premiosPorNivel = agruparPremiosAdminPorNivel();
        return niveis.stream()
                .map(nivel -> AdminRoletaNivelResponse.from(nivel, chances.getOrDefault(
                        nivel.getId(),
                        BigDecimal.ZERO
                ), premiosPorNivel.getOrDefault(nivel.getId(), List.of())))
                .toList();
    }

    private List<AdminRoletaOpcaoResponse> montarOpcoesAdmin() {
        // TODO: roleta_opcoes e legado; manter lista vazia ate a remocao definitiva da tabela.
        return List.of();
    }

    private List<AdminRoletaPremioResponse> montarPremiosAdmin() {
        return List.of();
    }

    private Map<Long, BigDecimal> calcularChances(List<RoletaNivel> niveisAtivos) {
        BigDecimal somaPesos = niveisAtivos.stream()
                .map(RoletaNivel::getPesoRelativo)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (somaPesos.compareTo(BigDecimal.ZERO) <= 0) {
            return Map.of();
        }

        return niveisAtivos.stream()
                .filter(nivel -> nivel.getId() != null)
                .collect(Collectors.toMap(
                        RoletaNivel::getId,
                        nivel -> nivel.getPesoRelativo()
                                .multiply(new BigDecimal("100"))
                                .divide(somaPesos, 4, RoundingMode.HALF_UP)
                ));
    }

    private Map<Long, Long> contarPremiosAtivosPorNivel() {
        return roletaPremioRepository.findAtivosComNivelAtivoOrdenados()
                .stream()
                .collect(Collectors.groupingBy(
                        premio -> premio.getNivel().getId(),
                        Collectors.counting()
                ));
    }

    private Map<Long, List<AdminRoletaPremioResponse>> agruparPremiosAdminPorNivel() {
        return roletaPremioRepository.findAllOrdenados()
                .stream()
                .collect(Collectors.groupingBy(
                        premio -> premio.getNivel().getId(),
                        Collectors.mapping(AdminRoletaPremioResponse::from, Collectors.toList())
                ));
    }

    private List<RoletaPremio> buscarPremiosAtivosValidos() {
        List<RoletaPremio> premios = roletaPremioRepository.findAtivosComNivelAtivoOrdenados();
        if (premios.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Roleta sem niveis ativos com premios"
            );
        }

        premios.forEach(this::validarPremioAtivoParaSorteio);
        return premios;
    }

    private List<RoletaNivel> buscarNiveisAtivosValidos(List<RoletaPremio> premiosAtivos) {
        Set<Long> niveisComPremio = premiosAtivos.stream()
                .map(RoletaPremio::getNivel)
                .filter(Objects::nonNull)
                .map(RoletaNivel::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        List<RoletaNivel> niveis = roletaNivelRepository.findByAtivoTrueOrderByOrdemAscIdAsc()
                .stream()
                .filter(nivel -> niveisComPremio.contains(nivel.getId()))
                .toList();

        if (niveis.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Roleta sem niveis ativos com premios"
            );
        }

        niveis.forEach(this::validarNivelAtivoParaSorteio);
        return niveis;
    }

    private void validarNivelAtivoParaSorteio(RoletaNivel nivel) {
        if (nivel.getNome() == null || nivel.getNome().isBlank()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Nivel da roleta sem nome");
        }
        if (nivel.getPesoRelativo().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Nivel ativo da roleta deve ter peso relativo maior que zero"
            );
        }
    }

    private void validarPremioAtivoParaSorteio(RoletaPremio premio) {
        if (premio.getNivel() == null || premio.getNivel().getId() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Premio da roleta sem nivel");
        }
        if (!Boolean.TRUE.equals(premio.getNivel().getAtivo())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Premio ativo deve pertencer a nivel ativo");
        }
        if (premio.getTipoPremio() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Premio da roleta sem tipo");
        }
        if (!isTipoPremioPermitidoNoSorteio(premio.getTipoPremio())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Premio ativo da roleta tem tipo invalido"
            );
        }
        if (premio.getValor().compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Premio da roleta nao pode ter valor negativo"
            );
        }
        if (premio.getTipoPremio() == RoletaTipoPremio.DESCONTO_VALOR
                && premio.getValor().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Premio de desconto em dinheiro deve ter valor positivo"
            );
        }
        if (premio.getTipoPremio() == RoletaTipoPremio.DESCONTO_PERCENTUAL
                && premio.getValor().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Premio de desconto percentual deve ter valor positivo"
            );
        }
        if (premio.getTipoPremio() == RoletaTipoPremio.GIRO_EXTRA
                && premio.getValor().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Premio de giro extra deve ter valor positivo"
            );
        }
    }

    private RoletaPremio sortearPremio(List<RoletaPremio> premios) {
        if (premios.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Roleta sem premios ativos no nivel sorteado"
            );
        }

        return premios.get(secureRandom.nextInt(premios.size()));
    }

    private RoletaNivel sortearNivel(List<RoletaNivel> niveis) {
        BigDecimal pesoTotal = niveis.stream()
                .map(RoletaNivel::getPesoRelativo)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (pesoTotal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Roleta sem niveis com peso valido"
            );
        }

        BigDecimal pontoSorteado = BigDecimal.valueOf(secureRandom.nextDouble())
                .multiply(pesoTotal);
        BigDecimal acumulado = BigDecimal.ZERO;
        for (RoletaNivel nivel : niveis) {
            acumulado = acumulado.add(nivel.getPesoRelativo());
            if (pontoSorteado.compareTo(acumulado) < 0) {
                return nivel;
            }
        }

        return niveis.get(niveis.size() - 1);
    }

    private List<RoletaPremio> premiosDoNivel(List<RoletaPremio> premios, RoletaNivel nivel) {
        return premios.stream()
                .filter(premio -> premio.getNivel().getId().equals(nivel.getId()))
                .toList();
    }

    private PremioCalculado calcularPremio(RoletaPremio premio) {
        if (premio.getTipoPremio() == RoletaTipoPremio.GIRO_EXTRA) {
            int giros = Math.max(1, premio.getValor().intValue());
            return new PremioCalculado(BigDecimal.valueOf(giros), giros);
        }
        if (premio.getTipoPremio() == RoletaTipoPremio.SEM_PREMIO) {
            return new PremioCalculado(BigDecimal.ZERO, 0);
        }

        return new PremioCalculado(premio.getValor(), 0);
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

    private String chaveGiroDiario(Usuario usuario, LocalDate data) {
        return "GIRO_DIARIO:" + usuario.getId() + ":" + data;
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

    private void atualizarNiveis(RoletaConfig config, List<AdminRoletaNivelRequest> requests) {
        List<RoletaNivel> existentes = roletaNivelRepository.findAllByOrderByOrdemAscIdAsc();
        Map<Long, RoletaNivel> niveisPorId = existentes.stream()
                .filter(nivel -> nivel.getId() != null)
                .collect(Collectors.toMap(RoletaNivel::getId, Function.identity()));
        Map<String, RoletaNivel> niveisPorNome = mapearNiveisPorNome(existentes);
        Map<Integer, RoletaNivel> niveisPorOrdem = mapearNiveisPorOrdem(existentes);

        Set<Long> idsRecebidos = new LinkedHashSet<>();
        List<RoletaNivel> proximosNiveis = new ArrayList<>();
        List<PremiosNivelRequest> premiosPorNivel = new ArrayList<>();
        BigDecimal ultimoPeso = BigDecimal.ZERO;

        List<AdminRoletaNivelRequest> requestsOrdenados = requests.stream()
                .sorted(Comparator.nullsLast(Comparator.comparing(
                        AdminRoletaNivelRequest::ordem,
                        Comparator.nullsLast(Comparator.naturalOrder())
                )))
                .toList();
        validarDuplicidadeNiveis(requestsOrdenados, niveisPorId);

        for (AdminRoletaNivelRequest request : requestsOrdenados) {
            validarNivelRequest(request);

            if (request.id() != null && !idsRecebidos.add(request.id())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Nivel da roleta repetido: " + request.id()
                );
            }

            RoletaNivel nivel = resolverNivelParaAtualizacao(
                    request,
                    niveisPorId,
                    niveisPorNome,
                    niveisPorOrdem
            );
            if (request.id() == null && nivel.getId() != null && !idsRecebidos.add(nivel.getId())) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Nivel da roleta repetido: " + nivel.getId()
                );
            }

            aplicarNivel(config, nivel, request, ultimoPeso);
            ultimoPeso = nivel.getPesoRelativo();
            proximosNiveis.add(nivel);
            if (request.premios() != null) {
                premiosPorNivel.add(new PremiosNivelRequest(nivel, request.premios()));
            }
        }

        Set<Long> idsMantidos = idsRecebidos;
        existentes.stream()
                .filter(nivel -> nivel.getId() != null && !idsMantidos.contains(nivel.getId()))
                .forEach(nivel -> {
                    nivel.setAtivo(false);
                    proximosNiveis.add(nivel);
                });

        roletaNivelRepository.saveAll(proximosNiveis);
        roletaNivelRepository.flush();
        premiosPorNivel.forEach(premios -> atualizarPremiosDoNivel(premios.nivel(), premios.premios()));
    }

    private void validarDuplicidadeNiveis(
            List<AdminRoletaNivelRequest> requests,
            Map<Long, RoletaNivel> niveisPorId
    ) {
        Set<Integer> ordensRecebidas = new LinkedHashSet<>();
        Set<String> nomesRecebidos = new LinkedHashSet<>();

        for (AdminRoletaNivelRequest request : requests) {
            if (request == null) {
                continue;
            }
            if (!isNivelAtivoNoPayload(request, niveisPorId)) {
                continue;
            }
            if (request.ordem() != null && !ordensRecebidas.add(request.ordem())) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Ordem do nivel da roleta repetida: " + request.ordem()
                );
            }
            if (request.nome() != null && !request.nome().isBlank()) {
                String nomeNormalizado = normalizarNomeNivel(request.nome());
                if (!nomesRecebidos.add(nomeNormalizado)) {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Nome do nivel da roleta repetido: " + request.nome().trim()
                    );
                }
            }
        }
    }

    private RoletaNivel resolverNivelParaAtualizacao(
            AdminRoletaNivelRequest request,
            Map<Long, RoletaNivel> niveisPorId,
            Map<String, RoletaNivel> niveisPorNome,
            Map<Integer, RoletaNivel> niveisPorOrdem
    ) {
        if (request.id() != null) {
            RoletaNivel nivel = niveisPorId.get(request.id());
            if (nivel == null) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Nivel da roleta nao encontrado: " + request.id()
                );
            }
            return nivel;
        }

        RoletaNivel nivelPorNome = request.nome() == null || request.nome().isBlank()
                ? null
                : niveisPorNome.get(normalizarNomeNivel(request.nome()));
        RoletaNivel nivelPorOrdem = request.ordem() == null
                ? null
                : niveisPorOrdem.get(request.ordem());

        if (nivelPorNome != null
                && nivelPorOrdem != null
                && !nivelPorNome.getId().equals(nivelPorOrdem.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Nome e ordem do nivel apontam para registros diferentes"
            );
        }

        if (nivelPorNome != null) {
            return nivelPorNome;
        }
        if (nivelPorOrdem != null) {
            return nivelPorOrdem;
        }

        return new RoletaNivel();
    }

    private Map<String, RoletaNivel> mapearNiveisPorNome(List<RoletaNivel> niveis) {
        return niveis.stream()
                .filter(nivel -> nivel.getNome() != null && !nivel.getNome().isBlank())
                .collect(Collectors.toMap(
                        nivel -> normalizarNomeNivel(nivel.getNome()),
                        Function.identity(),
                        this::preferirNivelAtivoOuMaisAntigo
                ));
    }

    private Map<Integer, RoletaNivel> mapearNiveisPorOrdem(List<RoletaNivel> niveis) {
        return niveis.stream()
                .filter(nivel -> nivel.getOrdem() != null)
                .collect(Collectors.toMap(
                        RoletaNivel::getOrdem,
                        Function.identity(),
                        this::preferirNivelAtivoOuMaisAntigo
                ));
    }

    private RoletaNivel preferirNivelAtivoOuMaisAntigo(RoletaNivel atual, RoletaNivel candidato) {
        if (!Boolean.TRUE.equals(atual.getAtivo()) && Boolean.TRUE.equals(candidato.getAtivo())) {
            return candidato;
        }
        if (Boolean.TRUE.equals(atual.getAtivo()) && !Boolean.TRUE.equals(candidato.getAtivo())) {
            return atual;
        }
        if (atual.getId() == null) {
            return candidato;
        }
        if (candidato.getId() == null) {
            return atual;
        }
        return atual.getId() <= candidato.getId() ? atual : candidato;
    }

    private boolean isNivelAtivoNoPayload(
            AdminRoletaNivelRequest request,
            Map<Long, RoletaNivel> niveisPorId
    ) {
        if (request.ativo() != null) {
            return request.ativo();
        }
        if (request.id() != null && niveisPorId.containsKey(request.id())) {
            return Boolean.TRUE.equals(niveisPorId.get(request.id()).getAtivo());
        }
        return true;
    }

    private String normalizarNomeNivel(String nome) {
        return nome.trim().toLowerCase(Locale.ROOT);
    }

    private void aplicarNivel(
            RoletaConfig config,
            RoletaNivel nivel,
            AdminRoletaNivelRequest request,
            BigDecimal ultimoPeso
    ) {
        if (request.nome() != null) {
            nivel.setNome(request.nome());
        } else if (nivel.getId() == null) {
            nivel.setNome("Nivel inativo");
        }
        if (request.descricao() != null) {
            nivel.setDescricao(request.descricao());
        }
        if (request.corHex() != null) {
            nivel.setCorHex(request.corHex());
        }
        if (request.ordem() != null) {
            nivel.setOrdem(request.ordem());
        }
        if (request.ativo() != null || nivel.getId() == null) {
            nivel.setAtivo(request.ativo());
        }
        nivel.setPesoRelativo(resolverPesoNivel(config, nivel, request, ultimoPeso));
    }

    private BigDecimal resolverPesoNivel(
            RoletaConfig config,
            RoletaNivel nivel,
            AdminRoletaNivelRequest request,
            BigDecimal ultimoPeso
    ) {
        if (request.pesoRelativo() != null) {
            return request.pesoRelativo();
        }
        if (nivel.getId() != null) {
            return nivel.getPesoRelativo();
        }
        if (ultimoPeso == null || ultimoPeso.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ONE;
        }

        return ultimoPeso.divide(
                config.getMultiplicadorDificuldadePadrao(),
                8,
                RoundingMode.HALF_UP
        );
    }

    private void validarNivelRequest(AdminRoletaNivelRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nivel da roleta e obrigatorio");
        }
        boolean ativo = request.ativo() == null || request.ativo();
        if (ativo) {
            if (request.nome() == null || request.nome().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome do nivel e obrigatorio");
            }
            if (request.ordem() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ordem do nivel e obrigatoria");
            }
            if (request.corHex() == null || !request.corHex().matches("^#[0-9a-fA-F]{6}$")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cor do nivel deve estar em hexadecimal");
            }
        }
        if (request.pesoRelativo() != null && request.pesoRelativo().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Peso relativo do nivel deve ser maior que zero"
            );
        }
    }

    private void atualizarOpcoes(List<AdminRoletaOpcaoRequest> requests) {
        List<RoletaOpcao> existentes = roletaOpcaoRepository.findAllByOrderByNivelAscOrdemAscIdAsc();
        Map<Long, RoletaOpcao> opcoesPorId = existentes.stream()
                .filter(opcao -> opcao.getId() != null)
                .collect(Collectors.toMap(RoletaOpcao::getId, Function.identity()));

        Set<Long> idsRecebidos = new LinkedHashSet<>();
        List<RoletaOpcao> proximasOpcoes = new ArrayList<>();

        for (AdminRoletaOpcaoRequest request : requests) {
            validarOpcaoRequest(request);

            RoletaOpcao opcao = request.id() == null
                    ? new RoletaOpcao()
                    : opcoesPorId.get(request.id());

            if (request.id() != null && opcao == null) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Opcao da roleta nao encontrada: " + request.id()
                );
            }
            if (request.id() != null && !idsRecebidos.add(request.id())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Opcao da roleta repetida: " + request.id()
                );
            }

            aplicarOpcao(opcao, request);
            proximasOpcoes.add(opcao);
        }

        Set<Long> idsMantidos = idsRecebidos;
        existentes.stream()
                .filter(opcao -> opcao.getId() != null && !idsMantidos.contains(opcao.getId()))
                .forEach(opcao -> {
                    opcao.setAtiva(false);
                    proximasOpcoes.add(opcao);
                });

        roletaOpcaoRepository.saveAll(proximasOpcoes);
    }

    private void aplicarOpcao(RoletaOpcao opcao, AdminRoletaOpcaoRequest request) {
        opcao.setNivel(request.nivel());
        opcao.setTitulo(request.titulo());
        opcao.setDescricao(request.descricao());
        opcao.setTipoPremio(request.tipoPremio());
        opcao.setValorMinimo(request.valorMinimo());
        opcao.setValorMaximo(request.valorMaximo());
        opcao.setPeso(request.peso() == null ? 1 : request.peso());
        opcao.setAtiva(request.ativa());
        opcao.setOrdem(request.ordem());
    }

    private void validarOpcaoRequest(AdminRoletaOpcaoRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Opcao da roleta e obrigatoria");
        }
        if (request.nivel() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nivel da opcao e obrigatorio");
        }
        if (request.titulo() == null || request.titulo().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Titulo da opcao e obrigatorio");
        }
        if (request.tipoPremio() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de premio e obrigatorio");
        }

        BigDecimal valorMinimo = request.valorMinimo() == null ? BigDecimal.ZERO : request.valorMinimo();
        BigDecimal valorMaximo = request.valorMaximo() == null ? BigDecimal.ZERO : request.valorMaximo();
        if (valorMinimo.compareTo(BigDecimal.ZERO) < 0 || valorMaximo.compareTo(BigDecimal.ZERO) < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Valores da opcao nao podem ser negativos"
            );
        }
        if (valorMinimo.compareTo(valorMaximo) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Valor minimo nao pode ser maior que o valor maximo"
            );
        }

        boolean ativa = request.ativa() == null || request.ativa();
        int peso = request.peso() == null ? 1 : request.peso();
        if (ativa && peso <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Peso deve ser maior que zero em opcoes ativas"
            );
        }

        if (ativa
                && request.tipoPremio() == RoletaTipoPremio.DESCONTO_VALOR
                && valorMaximo.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Desconto em dinheiro deve ter valor positivo"
            );
        }
        if (ativa
                && request.tipoPremio() == RoletaTipoPremio.DESCONTO_PERCENTUAL
                && valorMaximo.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Desconto percentual deve ter valor positivo"
            );
        }
    }

    private void atualizarPremios(List<AdminRoletaPremioRequest> requests) {
        List<RoletaPremio> existentes = roletaPremioRepository.findAllOrdenados();
        Map<Long, RoletaPremio> premiosPorId = existentes.stream()
                .filter(premio -> premio.getId() != null)
                .collect(Collectors.toMap(RoletaPremio::getId, Function.identity()));
        Map<Long, RoletaNivel> niveisPorId = roletaNivelRepository.findAllByOrderByOrdemAscIdAsc()
                .stream()
                .filter(nivel -> nivel.getId() != null)
                .collect(Collectors.toMap(RoletaNivel::getId, Function.identity()));

        Set<Long> idsRecebidos = new LinkedHashSet<>();
        List<RoletaPremio> proximosPremios = new ArrayList<>();

        for (AdminRoletaPremioRequest request : requests) {
            validarPremioRequest(request, true);

            RoletaPremio premio = request.id() == null
                    ? new RoletaPremio()
                    : premiosPorId.get(request.id());

            if (request.id() != null && premio == null) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Premio da roleta nao encontrado: " + request.id()
                );
            }
            if (request.id() != null && !idsRecebidos.add(request.id())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Premio da roleta repetido: " + request.id()
                );
            }

            RoletaNivel nivel = request.nivelId() == null && premio != null
                    ? premio.getNivel()
                    : niveisPorId.get(request.nivelId());
            if (nivel == null) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Nivel do premio da roleta nao encontrado"
                );
            }
            if ((request.ativo() == null || request.ativo()) && !Boolean.TRUE.equals(nivel.getAtivo())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Premio ativo deve pertencer a nivel ativo"
                );
            }

            aplicarPremio(premio, nivel, request);
            proximosPremios.add(premio);
        }

        Set<Long> idsMantidos = idsRecebidos;
        existentes.stream()
                .filter(premio -> premio.getId() != null && !idsMantidos.contains(premio.getId()))
                .forEach(premio -> {
                    premio.setAtivo(false);
                    premio.setPesoInterno(BigDecimal.ONE);
                    proximosPremios.add(premio);
                });

        roletaPremioRepository.saveAll(proximosPremios);
    }

    private void atualizarPremiosDoNivel(RoletaNivel nivel, List<AdminRoletaPremioRequest> requests) {
        List<RoletaPremio> existentes = roletaPremioRepository.findByNivelIdOrdenados(nivel.getId());
        Map<Long, RoletaPremio> premiosPorId = existentes.stream()
                .filter(premio -> premio.getId() != null)
                .collect(Collectors.toMap(RoletaPremio::getId, Function.identity()));

        Set<Long> idsRecebidos = new LinkedHashSet<>();
        List<RoletaPremio> proximosPremios = new ArrayList<>();

        for (AdminRoletaPremioRequest request : requests) {
            validarPremioRequest(request, false);

            RoletaPremio premio = request.id() == null
                    ? new RoletaPremio()
                    : premiosPorId.get(request.id());

            if (request.id() != null && premio == null) {
                throw new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Premio da roleta nao encontrado no nivel informado: " + request.id()
                );
            }
            if (request.id() != null && !idsRecebidos.add(request.id())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Premio da roleta repetido: " + request.id()
                );
            }
            if (request.nivelId() != null && !request.nivelId().equals(nivel.getId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Premio informado pertence a outro nivel"
                );
            }
            if ((request.ativo() == null || request.ativo()) && !Boolean.TRUE.equals(nivel.getAtivo())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Premio ativo deve pertencer a nivel ativo"
                );
            }

            aplicarPremio(premio, nivel, request);
            proximosPremios.add(premio);
        }

        Set<Long> idsMantidos = idsRecebidos;
        existentes.stream()
                .filter(premio -> premio.getId() != null && !idsMantidos.contains(premio.getId()))
                .forEach(premio -> {
                    premio.setAtivo(false);
                    premio.setPesoInterno(BigDecimal.ONE);
                    proximosPremios.add(premio);
                });

        roletaPremioRepository.saveAll(proximosPremios);
    }

    private void aplicarPremio(
            RoletaPremio premio,
            RoletaNivel nivel,
            AdminRoletaPremioRequest request
    ) {
        premio.setNivel(nivel);
        premio.setTipoPremio(request.tipoPremio());
        premio.setValor(request.valor());
        premio.setTitulo(gerarTituloPremio(request.tipoPremio(), request.valor()));
        premio.setDescricao(null);
        premio.setPesoInterno(BigDecimal.ONE);
        if (request.ordem() != null) {
            premio.setOrdem(request.ordem());
        }
        if (request.ativo() != null || premio.getId() == null) {
            premio.setAtivo(request.ativo());
        }
    }

    private void validarPremioRequest(AdminRoletaPremioRequest request, boolean exigirNivelId) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Premio da roleta e obrigatorio");
        }
        if (exigirNivelId && request.nivelId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nivel do premio e obrigatorio");
        }
        if (request.tipoPremio() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo de premio e obrigatorio");
        }
        if (!isTipoPremioPermitidoNoAdmin(request.tipoPremio())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tipo de premio deve ser DESCONTO_VALOR ou DESCONTO_PERCENTUAL"
            );
        }

        if (request.valor() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valor do premio e obrigatorio");
        }

        BigDecimal valor = request.valor();
        if (valor.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Valor do premio deve ser maior que zero"
            );
        }
    }

    private boolean isTipoPremioPermitidoNoAdmin(RoletaTipoPremio tipoPremio) {
        return tipoPremio == RoletaTipoPremio.DESCONTO_VALOR
                || tipoPremio == RoletaTipoPremio.DESCONTO_PERCENTUAL;
    }

    private boolean isTipoPremioPermitidoNoSorteio(RoletaTipoPremio tipoPremio) {
        return isTipoPremioPermitidoNoAdmin(tipoPremio)
                || tipoPremio == RoletaTipoPremio.GIRO_EXTRA
                || tipoPremio == RoletaTipoPremio.SEM_PREMIO;
    }

    private String gerarTituloPremio(RoletaTipoPremio tipoPremio, BigDecimal valor) {
        if (tipoPremio == RoletaTipoPremio.DESCONTO_PERCENTUAL) {
            return valor.stripTrailingZeros().toPlainString().replace('.', ',') + "% OFF";
        }

        return "R$ " + valor.setScale(2, RoundingMode.HALF_UP)
                .toPlainString()
                .replace('.', ',')
                + " OFF";
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
                config.getGirosPorConviteMin(),
                config.getGirosPorConviteMax(),
                config.getPercentualComissaoIndicacao(),
                config.getMultiplicadorDificuldadePadrao(),
                config.getUsarPesosManuais(),
                config.getAtualizadaEm(),
                produtos.stream().map(ProdutoResponseDTO::id).toList(),
                produtos,
                montarNiveisAdmin(),
                montarOpcoesAdmin(),
                montarPremiosAdmin(),
                roletaMetaService.listarAdmin()
        );
    }

    private RoletaConvitesResponse montarConvitesResponse(
            RoletaConfig config,
            RoletaParticipante participante
    ) {
        long quantidadeConvertida = usuarioRepository.countByIndicadoPorId(participante.getUsuario().getId());
        IndicacaoLinkResponse linkIndicacao = indicacaoService.obterLink(participante.getUsuario());

        return new RoletaConvitesResponse(
                linkIndicacao.codigo(),
                linkIndicacao.url(),
                quantidadeConvertida,
                quantidadeConvertida,
                config.getGirosGanhosPorConvite(),
                config.getGirosGanhosPorConvite(),
                config.getGirosPorConviteMin(),
                config.getGirosPorConviteMax()
        );
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

    private record PremioCalculado(BigDecimal valorPremio, Integer girosExtras) {
    }

    private record PremiosNivelRequest(RoletaNivel nivel, List<AdminRoletaPremioRequest> premios) {
    }

    private record FaixaDesconto(BigDecimal minimo, BigDecimal maximo) {

        private FaixaDesconto(String minimo, String maximo) {
            this(new BigDecimal(minimo), new BigDecimal(maximo));
        }
    }
}
